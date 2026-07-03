export interface GameTimer {
    start(): void;
    stop(): number;
    isRunning(): boolean;
    getDisplayMicroseconds(): number;
    hasExpired(): boolean;
    getElapsedMicrosecondsForScore(): number;
}

export function formatElapsedMicroseconds(totalMicroseconds: number): string {
    const minutes = Math.floor(totalMicroseconds / 60_000_000);
    const seconds = Math.floor((totalMicroseconds % 60_000_000) / 1_000_000);
    const fractional = Math.floor((totalMicroseconds % 1_000_000) / 1_000);

    return `${String(minutes).padStart(2, '0')}min.${String(seconds).padStart(2, '0')}s.${String(fractional).padStart(3, '0')}`;
}

export function formatScoreWithTime(score: number, elapsedMicroseconds: number): string {
    const label = score === 1 ? 'drapeau' : 'drapeaux';

    return `${score} ${label} en ${formatElapsedMicroseconds(elapsedMicroseconds)}`;
}

export function createElapsedTimer(): GameTimer {
    let startedAt: number | null = null;
    let stoppedAt: number | null = null;

    function getElapsedMicroseconds(): number {
        if (startedAt === null) {
            return 0;
        }

        const end = stoppedAt ?? performance.now();

        return Math.floor((end - startedAt) * 1000);
    }

    return {
        start() {
            startedAt = performance.now();
            stoppedAt = null;
        },
        stop() {
            if (startedAt === null) {
                return 0;
            }

            stoppedAt = performance.now();

            return getElapsedMicroseconds();
        },
        isRunning() {
            return startedAt !== null && stoppedAt === null;
        },
        getDisplayMicroseconds: getElapsedMicroseconds,
        hasExpired: () => false,
        getElapsedMicrosecondsForScore: getElapsedMicroseconds,
    };
}

export function createCountdownTimer(durationMs: number): GameTimer {
    let startedAt: number | null = null;
    let stoppedAt: number | null = null;
    const durationMicroseconds = durationMs * 1000;

    function getRemainingMicroseconds(): number {
        if (startedAt === null) {
            return durationMicroseconds;
        }

        const end = stoppedAt ?? performance.now();
        const elapsed = Math.floor((end - startedAt) * 1000);

        return Math.max(0, durationMicroseconds - elapsed);
    }

    function getElapsedMicrosecondsForScore(): number {
        return durationMicroseconds - getRemainingMicroseconds();
    }

    return {
        start() {
            startedAt = performance.now();
            stoppedAt = null;
        },
        stop() {
            if (startedAt === null) {
                return 0;
            }

            stoppedAt = performance.now();

            return getElapsedMicrosecondsForScore();
        },
        isRunning() {
            return startedAt !== null && stoppedAt === null && getRemainingMicroseconds() > 0;
        },
        getDisplayMicroseconds: getRemainingMicroseconds,
        hasExpired: () => getRemainingMicroseconds() === 0,
        getElapsedMicrosecondsForScore,
    };
}

export function createGameTimer(options?: { countdownMs?: number }): GameTimer {
    if (options?.countdownMs) {
        return createCountdownTimer(options.countdownMs);
    }

    return createElapsedTimer();
}

/** @deprecated Use createElapsedTimer or createGameTimer */
export function createQuizTimer(): GameTimer {
    return createElapsedTimer();
}
