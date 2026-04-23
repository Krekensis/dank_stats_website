export function removeOutliers(data) {
    if (!data.length) return data;
    const values = data.map(d => d.y).sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length / 4)];
    const q3 = values[Math.floor(values.length * 3 / 4)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.filter(d => d.y >= lower && d.y <= upper);
}

export function generateThreeLabels(trades) {
    const totalPoints = trades.length;
    if (totalPoints === 0) return [];
    if (totalPoints === 1) return [0];
    if (totalPoints === 2) return [0, 1];

    const first = 0;
    const last = totalPoints - 1;
    const middle = Math.floor(totalPoints / 2);

    return [first, middle, last];
}

export function movingAverageLine(data, windowSize = 5) {
    if (data.length < 2) return [];

    const sorted = [...data].sort((a, b) => a.x - b.x);
    const smoothed = [];

    for (let i = 0; i < sorted.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(sorted.length, i + Math.floor(windowSize / 2) + 1);
        const subset = sorted.slice(start, end);
        const avgY = subset.reduce((sum, d) => sum + d.y, 0) / subset.length;
        smoothed.push({ x: sorted[i].x, y: avgY });
    }

    return smoothed;
}
