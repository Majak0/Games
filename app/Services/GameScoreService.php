<?php

namespace App\Services;

use App\Models\GameScore;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class GameScoreService
{
    /**
     * @return array<string, array<string, array{label: string, type: string}>>
     */
    public function modeCatalog(): array
    {
        /** @var array<string, array<string, array{label: string, type: string}>> $catalog */
        $catalog = config('game_modes');

        return $catalog;
    }

    public function modeType(string $game, string $mode): string
    {
        $catalog = $this->modeCatalog();

        if (! isset($catalog[$game][$mode])) {
            throw new InvalidArgumentException('Mode de jeu invalide.');
        }

        return $catalog[$game][$mode]['type'];
    }

    public function modeLabel(string $game, string $mode): string
    {
        $catalog = $this->modeCatalog();

        return $catalog[$game][$mode]['label'] ?? $mode;
    }

    /**
     * @param  array{score: int, elapsed_microseconds: int, completed: bool}  $incoming
     * @return array{saved: bool, improved: bool, rank: int|null, total: int, score: GameScore|null}
     */
    public function submit(User $user, string $game, string $mode, array $incoming): array
    {
        $this->modeType($game, $mode);

        $existing = GameScore::query()->firstOrNew([
            'user_id' => $user->id,
            'game' => $game,
            'mode' => $mode,
        ]);

        $improved = ! $existing->exists || $this->isBetter($incoming, $existing, $this->modeType($game, $mode));

        if (! $improved) {
            return [
                'saved' => false,
                'improved' => false,
                'rank' => $this->rankFor($existing),
                'total' => $this->totalPlayers($game, $mode),
                'score' => $existing,
            ];
        }

        $existing->fill([
            'score' => $incoming['score'],
            'elapsed_microseconds' => $incoming['elapsed_microseconds'],
            'completed' => $incoming['completed'],
        ]);
        $existing->save();

        return [
            'saved' => true,
            'improved' => true,
            'rank' => $this->rankFor($existing),
            'total' => $this->totalPlayers($game, $mode),
            'score' => $existing,
        ];
    }

    /**
     * @param  array{score: int, elapsed_microseconds: int, completed: bool}  $incoming
     */
    public function isBetter(array $incoming, GameScore $existing, string $type): bool
    {
        if ($type === 'chrono') {
            if ($incoming['score'] !== $existing->score) {
                return $incoming['score'] > $existing->score;
            }

            return $incoming['elapsed_microseconds'] < $existing->elapsed_microseconds;
        }

        if ((int) $incoming['completed'] !== (int) $existing->completed) {
            return $incoming['completed'] && ! $existing->completed;
        }

        if ($incoming['score'] !== $existing->score) {
            return $incoming['score'] > $existing->score;
        }

        return $incoming['elapsed_microseconds'] < $existing->elapsed_microseconds;
    }

    public function rankFor(GameScore $score): int
    {
        $type = $this->modeType($score->game, $score->mode);

        return $this->orderedQuery($score->game, $score->mode, $type)
            ->where(function (Builder $query) use ($score, $type) {
                $this->applyBetterThan($query, $score, $type);
            })
            ->count() + 1;
    }

    public function totalPlayers(string $game, string $mode): int
    {
        return GameScore::query()
            ->where('game', $game)
            ->where('mode', $mode)
            ->count();
    }

    /**
     * @return Collection<int, GameScore>
     */
    public function leaderboard(string $game, string $mode, int $limit = 100): Collection
    {
        $type = $this->modeType($game, $mode);

        return $this->orderedQuery($game, $mode, $type)
            ->with('user:id,username')
            ->limit($limit)
            ->get();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function profileScores(User $user): array
    {
        $rows = [];

        foreach ($this->modeCatalog() as $game => $modes) {
            foreach (array_keys($modes) as $mode) {
                $score = GameScore::query()
                    ->where('user_id', $user->id)
                    ->where('game', $game)
                    ->where('mode', $mode)
                    ->first();

                if (! $score) {
                    continue;
                }

                $rows[] = [
                    'game' => $game,
                    'mode' => $mode,
                    'label' => $this->modeLabel($game, $mode),
                    'score' => $score->score,
                    'elapsed_microseconds' => $score->elapsed_microseconds,
                    'completed' => $score->completed,
                    'rank' => $this->rankFor($score),
                    'total' => $this->totalPlayers($game, $mode),
                ];
            }
        }

        return $rows;
    }

    public function pruneBeyondTop(int $keep = 100): int
    {
        $deleted = 0;

        $pairs = GameScore::query()
            ->select('game', 'mode')
            ->distinct()
            ->get();

        foreach ($pairs as $pair) {
            $type = $this->modeType($pair->game, $pair->mode);
            $keepIds = $this->orderedQuery($pair->game, $pair->mode, $type)
                ->limit($keep)
                ->pluck('id');

            $deleted += GameScore::query()
                ->where('game', $pair->game)
                ->where('mode', $pair->mode)
                ->whereNotIn('id', $keepIds)
                ->delete();
        }

        return $deleted;
    }

    private function orderedQuery(string $game, string $mode, string $type): Builder
    {
        $query = GameScore::query()
            ->where('game', $game)
            ->where('mode', $mode);

        if ($type === 'chrono') {
            return $query
                ->orderByDesc('score')
                ->orderBy('elapsed_microseconds');
        }

        return $query
            ->orderByDesc('completed')
            ->orderByDesc('score')
            ->orderBy('elapsed_microseconds');
    }

    private function applyBetterThan(Builder $query, GameScore $reference, string $type): void
    {
        if ($type === 'chrono') {
            $query->where(function (Builder $inner) use ($reference) {
                $inner->where('score', '>', $reference->score)
                    ->orWhere(function (Builder $tie) use ($reference) {
                        $tie->where('score', $reference->score)
                            ->where('elapsed_microseconds', '<', $reference->elapsed_microseconds);
                    });
            });

            return;
        }

        $query->where(function (Builder $inner) use ($reference) {
            $inner->where('completed', '>', $reference->completed)
                ->orWhere(function (Builder $completedTie) use ($reference) {
                    $completedTie->where('completed', $reference->completed)
                        ->where('score', '>', $reference->score);
                })
                ->orWhere(function (Builder $scoreTie) use ($reference) {
                    $scoreTie->where('completed', $reference->completed)
                        ->where('score', $reference->score)
                        ->where('elapsed_microseconds', '<', $reference->elapsed_microseconds);
                });
        });
    }
}
