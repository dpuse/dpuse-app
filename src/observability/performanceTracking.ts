// External dependencies
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// App core
import { trackEvent } from '@/observability/eventTracking';

// Functions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function initialise(): void {
    onLCP(trackWebVitalMetric);
    onINP(trackWebVitalMetric);
    onCLS(trackWebVitalMetric);
    onFCP(trackWebVitalMetric);
    onTTFB(trackWebVitalMetric);
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function trackWebVitalMetric(metric: Metric): void {
    trackEvent('performance', {
        name: metric.name,
        navigationType: metric.navigationType,
        perfDelta: metric.delta,
        perfRating: metric.rating,
        perfValue: metric.value
    });
}
