# Module State Ledger _(updated 2026-01-15 09:30 UTC)_

Datapos Copilot uses this ledger to answer "show current module states" and similar questions. It reflects the durable-state payloads currently deployed through the `DO_STATES` object in the API worker.

## Status Legend

| Status      | Meaning                                                                                | Typical Actions                                                              |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Operational | Module is healthy and meeting its service-level objectives.                            | Continue automated monitoring and weekly review.                             |
| Degraded    | Module is running but missing at least one target (freshness, latency, or error rate). | Leave module online, file follow-up, raise warning in Ops channel.           |
| At Risk     | Module output is still consumable but a blocking issue is imminent.                    | Assign owner, create task, prioritise mitigation window.                     |
| Blocked     | Module cannot complete its workflow without manual intervention.                       | Freeze downstream deployments, open incident, coordinate rollback if needed. |

## Snapshot

| Module               | Stage     | Status      | Data Freshness        | Last Change        | Owner                 | Next Action                                                      |
| -------------------- | --------- | ----------- | --------------------- | ------------------ | --------------------- | ---------------------------------------------------------------- |
| establishDataViews   | Source    | Operational | 7 min lag             | 06:55 UTC deploy   | Data Platform         | Audit relationships before next ingest at 10:00 UTC.             |
| assembleDimensions   | Transform | Degraded    | 24 min lag            | 07:20 UTC          | Analytics Engineering | Verify `dimension_storefront` skew + rerun `configureDimension`. |
| contextualiseData    | Transform | At Risk     | 38 min lag            | 07:05 UTC          | Customer Intelligence | Finish event query patch + regression tests.                     |
| explorePresentations | Visualise | Operational | 11 min lag            | 07:10 UTC          | Experience Studio     | No action; monitor telemetry widget sync.                        |
| buildDataApps        | Visualise | Blocked     | n/a (pipeline halted) | 06:40 UTC rollback | App Factory           | Waiting on API schema contract from partner team.                |

## Detailed Notes

### establishDataViews _(source layer)_

- **Purpose:** Connect to partner sources, select the correct node, audit content/relationships, apply transforms, and verify landing datasets.
- **Current state:** Operational — ingestion is streaming at 22.4k rows/min, error rate 0.08%. Latest deploy tightened validation on `selectNode` to reject orphaned schemas.
- **Freshness target:** < 10 min end-to-end. Current lag 7 min thanks to auto-scaling of the ingestion worker.
- **Watch items:**
    - `auditContent` flagged two warning-level issues (unexpected null geometry). Deferred to post-cycle triage.
    - `applyTransforms` completed with retry count = 1 (transient Bigtable throttle).
- **Action queue:**
    1.  `selectConnection` – keep `atlas-east` primary; fallback remains healthy.
    2.  `auditRelationships` – scheduled for 09:55 UTC to verify the new partner feed join graph.
- **State payload:**
    ```json
    {
        "id": "establishDataViews",
        "typeId": "source",
        "status": "operational",
        "owner": "data-platform",
        "lastDeploy": "2026-01-15T06:55:00Z",
        "freshnessMinutes": 7,
        "nextAction": "auditRelationships"
    }
    ```

### assembleDimensions _(transform layer)_

- **Purpose:** Build curated dimensional models after the source layer stabilises.
- **Current state:** Degraded — latency introduced by skew detected in `dimension_storefront` (node `dwh.dim_storefront_v14`).
- **Freshness target:** < 15 min. Current lag 24 min due to a throttled warehouse slot.
- **Watch items:**
    - `configureDimension` flagged an 11% null increase on `store_segment`. Root cause under investigation.
    - `verifyResult` auto-test failed on scenario `dim-storefront::sales_alignment`; rerun scheduled 09:20 UTC.
- **Action queue:**
    1.  Rebalance the shared warehouse slot (Analytics Engineering on call: @lena).
    2.  Regenerate semantic layer manifest once the rerun succeeds.
- **State payload:**
    ```json
    {
        "id": "assembleDimensions",
        "typeId": "transform",
        "status": "degraded",
        "owner": "analytics-engineering",
        "lastDeploy": "2026-01-15T07:20:00Z",
        "freshnessMinutes": 24,
        "nextAction": "configureDimension::rerun"
    }
    ```

### contextualiseData _(transform layer)_

- **Purpose:** Apply event-context logic and enrichment via `configureEventQuery`, ensuring downstream telemetry has business context.
- **Current state:** At Risk — context rules for `partner_beta` are stuck behind a schema update; partial output still available.
- **Freshness target:** < 30 min. Current lag 38 min because `configureEventQuery` paused on missing `campaign_id`.
- **Watch items:**
    - Query validator reports 4 blocking violations; patch PR #582 queued for review.
    - Observability indicates 96th percentile latency creeping to 4.1 s (target 3.5 s).
- **Action queue:**
    1.  Approve & deploy the query patch before 10:30 UTC window.
    2.  Re-run `verifyResult` suite, focusing on the `re-attribution` scenario.
- **State payload:**
    ```json
    {
        "id": "contextualiseData",
        "typeId": "transform",
        "status": "at-risk",
        "owner": "customer-intelligence",
        "lastDeploy": "2026-01-15T07:05:00Z",
        "freshnessMinutes": 38,
        "nextAction": "configureEventQuery::patch"
    }
    ```

### explorePresentations _(visualise layer)_

- **Purpose:** Provide analysts with presentation-ready exploration spaces and telemetry dashboards.
- **Current state:** Operational — dashboards synced successfully after overnight cache warmup.
- **Freshness target:** < 15 min. Current lag 11 min, within limits.
- **Watch items:**
    - Storyboard `ops-latency` has a pending design tweak but does not block delivery.
    - No unresolved incidents; telemetry sync job completed in 2.3 min (target 3 min).
- **Action queue:**
    1.  Validate new chart palette w/ Experience Studio before tomorrow’s release.
    2.  Review embed tokens for partner portal (expires 2026-01-18).
- **State payload:**
    ```json
    {
        "id": "explorePresentations",
        "typeId": "visualise",
        "status": "operational",
        "owner": "experience-studio",
        "lastDeploy": "2026-01-15T07:10:00Z",
        "freshnessMinutes": 11,
        "nextAction": "telemetry-widget::monitor"
    }
    ```

### buildDataApps _(visualise layer)_

- **Purpose:** Ship internal and customer-facing data apps that consume curated layers.
- **Current state:** Blocked — deployment halted because partner API schema v3.6 not yet approved.
- **Freshness target:** n/a while blocked.
- **Watch items:**
    - App Factory paused the CI pipeline at step `deploy:edge`. Last successful commit `a72b83f`.
    - Contract tests waiting on API team to publish the schema through the sandbox.
- **Action queue:**
    1.  Receive signed schema contract ETA 12:00 UTC. Without it, release will slip.
    2.  Prep rollback plan for `app-insights-pro` should the schema diverge.
- **State payload:**
    ```json
    {
        "id": "buildDataApps",
        "typeId": "visualise",
        "status": "blocked",
        "owner": "app-factory",
        "lastDeploy": "2026-01-15T06:40:00Z",
        "freshnessMinutes": null,
        "nextAction": "await-partner-schema"
    }
    ```

## Operational Hooks

- Pull live module data: `GET https://api.datapos.app/states` (optionally filter with `?typeId=source|transform|visualise`).
- Upsert a module payload after resolving an issue: `PUT https://api.datapos.app/states/{moduleId}` with the JSON structures shown above.
- Clear stuck state (incident use only): `DELETE https://api.datapos.app/states/{moduleId}` or `DELETE /states` for a full reset before re-seeding from IaC.

## Current Risks & Follow-ups

## Operational Hooks

- Pull live module data: `GET https://api.datapos.app/states` (optionally filter with `?typeId=source|transform|visualise`).
- Upsert a module payload after resolving an issue: `PUT https://api.datapos.app/states/{moduleId}` with the JSON structures shown above.
- Clear stuck state (incident use only): `DELETE https://api.datapos.app/states/{moduleId}` or `DELETE /states` for a full reset before re-seeding from IaC.

## Current Risks & Follow-ups

- `assembleDimensions`: Investigate skew + null spike before noon UTC to keep analytics SLA intact.
- `contextualiseData`: Query patch approval is the critical path for reconnecting partner beta signals.
- `buildDataApps`: Partner API contract is the only blocker; escalate to partner manager if no update by 11:30 UTC.

Maintainers: `@data-platform`, `@analytics-eng`, `@cust-intel`, `@exp-studio`, `@app-factory`.
