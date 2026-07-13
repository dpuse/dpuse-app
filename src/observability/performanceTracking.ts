// ── External Dependencies & Registrations
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// ── Local (App) Framework
import { trackEvent } from '@/observability/eventTracking';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    onLCP(trackWebVitalMetric);
    onINP(trackWebVitalMetric);
    onCLS(trackWebVitalMetric);
    onFCP(trackWebVitalMetric);
    onTTFB(trackWebVitalMetric);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function trackWebVitalMetric(metric: Metric): void {
    trackEvent('performance', {
        name: metric.name,
        navigationType: metric.navigationType,
        perfDelta: metric.delta,
        perfRating: metric.rating,
        perfValue: metric.value
    });
}
