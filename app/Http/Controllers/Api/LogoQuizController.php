<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LogoQuizService;
use App\Support\LogoCategories;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class LogoQuizController extends Controller
{
    public function __construct(private LogoQuizService $quiz)
    {
        $this->quiz->allowInsecureDownloads(app()->environment('local'));
    }

    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'style' => ['required', 'string', 'in:flou,nb,color'],
            'category' => ['nullable', 'string', Rule::in(LogoCategories::ids())],
        ]);

        $style = $validated['style'];
        $category = $validated['category'] ?? null;

        if ($style === 'color' && $category === null) {
            return response()->json(['message' => 'Choisissez une catégorie.'], 422);
        }

        try {
            return response()->json($this->quiz->start($style, $category));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => $this->quiz->categories(),
        ]);
    }

    public function guess(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'answer' => ['required', 'string', 'max:120'],
        ]);

        try {
            return response()->json($this->quiz->guess($validated['answer']));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function skip(): JsonResponse
    {
        try {
            return response()->json($this->quiz->skip());
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function visual(Request $request): Response
    {
        $token = (string) $request->query('t', '');

        return $this->visualResponse(fn (): array => $this->quiz->visualByToken($token));
    }

    public function found(string $token): Response
    {
        return $this->visualResponse(fn (): array => $this->quiz->foundByToken($token));
    }

    /**
     * @param  callable(): array{body: string, mime: string}  $resolver
     */
    private function visualResponse(callable $resolver): Response
    {
        try {
            $visual = $resolver();

            return response($visual['body'], HttpResponse::HTTP_OK, [
                'Content-Type' => $visual['mime'],
                'Cache-Control' => 'private, max-age=3600',
                'X-Content-Type-Options' => 'nosniff',
                'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:",
            ]);
        } catch (RuntimeException) {
            abort(HttpResponse::HTTP_NOT_FOUND);
        }
    }
}
