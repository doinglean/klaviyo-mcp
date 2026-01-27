# Klaviyo MCP Server - API Coverage Audit

**Audit Date:** 2026-01-26  
**OpenAPI Spec Version:** stable.json (GitHub: klaviyo/openapi)  
**Total Klaviyo API Endpoints:** 304  
**Implemented MCP Tools:** 77  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total API Endpoints | 304 |
| Server-Side Endpoints (excl. Client) | 294 |
| Implemented Tools | 77 |
| Unique API Endpoints Covered | ~65 |
| **Overall Coverage** | **~22%** |

> **Note:** Some tools map to multiple endpoints (e.g., convenience wrappers), while some tools combine multiple API calls.

---

## Coverage by Category

### ✅ Well Covered Categories

| Category | API Endpoints | Implemented | Coverage | Status |
|----------|---------------|-------------|----------|--------|
| **Profiles** | 34 | 17 tools | ~50% | ✅ Good |
| **Lists** | 13 | 10 tools | ~77% | ✅ Good |
| **Campaigns** | 26 | 18 tools | ~69% | ✅ Good |
| **Events** | 8 | 6 tools | ~75% | ✅ Good |
| **Metrics** | 24 | 9 tools | ~38% | ✅ Core covered |
| **Segments** | 11 | 8 tools | ~73% | ✅ Good |
| **Templates** | 12 | 9 tools | ~75% | ✅ Good |

### ❌ Missing Categories

| Category | API Endpoints | Implemented | Coverage | Priority |
|----------|---------------|-------------|----------|----------|
| **Flows** | 20 | 0 | 0% | 🔴 HIGH |
| **Catalogs** | 55 | 0 | 0% | 🔴 HIGH |
| **Tags** | 26 | 0 | 0% | 🟡 MEDIUM |
| **Coupons** | 17 | 0 | 0% | 🟡 MEDIUM |
| **Webhooks** | 7 | 0 | 0% | 🟡 MEDIUM |
| **Reporting** | 7 | 0 | 0% | 🟡 MEDIUM |
| **Images** | 5 | 0 | 0% | 🟡 MEDIUM |
| **Forms** | 9 | 0 | 0% | 🟢 LOW |
| **Custom Objects** | 6 | 0 | 0% | 🟢 LOW |
| **Accounts** | 2 | 0 | 0% | 🟢 LOW |
| **Data Privacy** | 1 | 0 | 0% | 🟢 LOW |
| **Reviews** | 3 | 0 | 0% | 🟢 LOW |
| **Tracking Settings** | 3 | 0 | 0% | 🟢 LOW |
| **Web Feeds** | 5 | 0 | 0% | 🟢 LOW |
| **Client APIs** | 10 | N/A | N/A | ⚪ Not applicable |

---

## Detailed Endpoint Analysis

### 📊 Profiles (34 endpoints) - ~50% Coverage

#### ✅ Implemented
- `GET /api/profiles` → `klaviyo_profiles_list`
- `POST /api/profiles` → `klaviyo_profiles_create`
- `GET /api/profiles/{id}` → `klaviyo_profiles_get`
- `PATCH /api/profiles/{id}` → `klaviyo_profiles_update`
- `GET /api/profile-bulk-import-jobs` → `klaviyo_profiles_bulk_import_jobs_list`
- `POST /api/profile-bulk-import-jobs` → `klaviyo_profiles_bulk_import`
- `GET /api/profile-bulk-import-jobs/{job_id}` → `klaviyo_profiles_bulk_import_job_get`
- `GET /api/profile-suppression-bulk-create-jobs` → `klaviyo_profiles_suppression_jobs_list`
- `POST /api/profile-suppression-bulk-create-jobs` → `klaviyo_profiles_suppress`
- `GET /api/profile-suppression-bulk-create-jobs/{job_id}` → `klaviyo_profiles_suppression_job_get`
- `GET /api/profile-suppression-bulk-delete-jobs` → `klaviyo_profiles_suppression_jobs_list`
- `POST /api/profile-suppression-bulk-delete-jobs` → `klaviyo_profiles_unsuppress`
- `GET /api/profile-suppression-bulk-delete-jobs/{job_id}` → `klaviyo_profiles_suppression_job_get`
- `POST /api/profile-import` → `klaviyo_profiles_upsert`
- `POST /api/profile-merge` → `klaviyo_profiles_merge`
- `POST /api/profile-subscription-bulk-create-jobs` → `klaviyo_profiles_subscribe`
- `POST /api/profile-subscription-bulk-delete-jobs` → `klaviyo_profiles_unsubscribe`
- `GET /api/profiles/{id}/lists` → `klaviyo_profiles_get_lists`
- `GET /api/profiles/{id}/segments` → `klaviyo_profiles_get_segments`

#### ❌ Missing
- `GET /api/push-tokens` - List all push tokens
- `POST /api/push-tokens` - Create push token
- `GET /api/push-tokens/{id}` - Get push token
- `DELETE /api/push-tokens/{id}` - Delete push token
- `GET /api/profiles/{id}/push-tokens` - Get profile's push tokens
- `GET /api/profile-bulk-import-jobs/{id}/lists` - Get lists for import job
- `GET /api/profile-bulk-import-jobs/{id}/profiles` - Get profiles for import job
- `GET /api/profile-bulk-import-jobs/{id}/import-errors` - Get import errors
- `GET /api/push-tokens/{id}/profile` - Get profile for push token
- Relationship endpoints (6)

---

### 📋 Lists (13 endpoints) - ~77% Coverage

#### ✅ Implemented
- `GET /api/lists` → `klaviyo_lists_list`
- `POST /api/lists` → `klaviyo_lists_create`
- `GET /api/lists/{id}` → `klaviyo_lists_get`
- `PATCH /api/lists/{id}` → `klaviyo_lists_update`
- `DELETE /api/lists/{id}` → `klaviyo_lists_delete`
- `GET /api/lists/{id}/tags` → `klaviyo_lists_get_tags`
- `GET /api/lists/{id}/profiles` → `klaviyo_lists_get_profiles`
- `POST /api/lists/{id}/relationships/profiles` → `klaviyo_lists_add_profiles`
- `DELETE /api/lists/{id}/relationships/profiles` → `klaviyo_lists_remove_profiles`
- `GET /api/lists/{id}/flow-triggers` → `klaviyo_lists_get_flow_triggers`

#### ❌ Missing
- `GET /api/lists/{id}/relationships/tags`
- `GET /api/lists/{id}/relationships/profiles`
- `GET /api/lists/{id}/relationships/flow-triggers`

---

### 📧 Campaigns (26 endpoints) - ~69% Coverage

#### ✅ Implemented
- `GET /api/campaigns` → `klaviyo_campaigns_list`
- `POST /api/campaigns` → `klaviyo_campaigns_create`
- `GET /api/campaigns/{id}` → `klaviyo_campaigns_get`
- `PATCH /api/campaigns/{id}` → `klaviyo_campaigns_update`
- `DELETE /api/campaigns/{id}` → `klaviyo_campaigns_delete`
- `GET /api/campaign-messages/{id}` → `klaviyo_campaigns_get_message`
- `PATCH /api/campaign-messages/{id}` → `klaviyo_campaigns_update_message`
- `GET /api/campaign-send-jobs/{id}` → `klaviyo_campaigns_get_send_job`
- `PATCH /api/campaign-send-jobs/{id}` → `klaviyo_campaigns_cancel_send`
- `GET /api/campaign-recipient-estimation-jobs/{id}` → `klaviyo_campaigns_get_recipient_estimation_job`
- `GET /api/campaign-recipient-estimations/{id}` → `klaviyo_campaigns_get_recipient_estimation`
- `POST /api/campaign-clone` → `klaviyo_campaigns_clone`
- `POST /api/campaign-message-assign-template` → `klaviyo_campaigns_assign_template`
- `POST /api/campaign-send-jobs` → `klaviyo_campaigns_send`
- `POST /api/campaign-recipient-estimation-jobs` → `klaviyo_campaigns_estimate_recipients`
- `GET /api/campaigns/{id}/tags` → `klaviyo_campaigns_get_tags`
- `GET /api/campaigns/{id}/campaign-messages` → `klaviyo_campaigns_get_messages`
- `POST /api/campaign-values-reports` → `klaviyo_campaigns_create_values_report`

#### ❌ Missing
- `GET /api/campaign-messages/{id}/campaign` - Get campaign from message
- `GET /api/campaign-messages/{id}/template` - Get template from message
- `GET /api/campaign-messages/{id}/image` - Get image from message
- `PATCH /api/campaign-messages/{id}/relationships/image` - Update message image
- Relationship endpoints (5)

---

### 📈 Events (8 endpoints) - ~75% Coverage

#### ✅ Implemented
- `GET /api/events` → `klaviyo_events_list`
- `POST /api/events` → `klaviyo_events_create`
- `GET /api/events/{id}` → `klaviyo_events_get`
- `POST /api/event-bulk-create-jobs` → `klaviyo_events_bulk_create`
- `GET /api/events/{id}/metric` → `klaviyo_events_get_metric`
- `GET /api/events/{id}/profile` → `klaviyo_events_get_profile`

#### ❌ Missing
- `GET /api/events/{id}/relationships/metric`
- `GET /api/events/{id}/relationships/profile`

---

### 📊 Metrics (24 endpoints) - ~38% Coverage

#### ✅ Implemented
- `GET /api/metrics` → `klaviyo_metrics_list`
- `GET /api/metrics/{id}` → `klaviyo_metrics_get`
- `GET /api/metric-properties/{id}` → `klaviyo_metrics_get_property`
- `POST /api/metric-aggregates` → `klaviyo_metrics_query_aggregate`
- `GET /api/metrics/{id}/flow-triggers` → `klaviyo_metrics_get_flow_triggers`
- `GET /api/metrics/{id}/metric-properties` → `klaviyo_metrics_get_properties`

#### ❌ Missing
- `GET /api/custom-metrics` - List custom metrics
- `POST /api/custom-metrics` - Create custom metric
- `GET /api/custom-metrics/{id}` - Get custom metric
- `PATCH /api/custom-metrics/{id}` - Update custom metric
- `DELETE /api/custom-metrics/{id}` - Delete custom metric
- `GET /api/mapped-metrics` - List mapped metrics
- `GET /api/mapped-metrics/{id}` - Get mapped metric
- `PATCH /api/mapped-metrics/{id}` - Update mapped metric
- Relationship endpoints (8)

---

### 🎯 Segments (11 endpoints) - ~73% Coverage

#### ✅ Implemented
- `GET /api/segments` → `klaviyo_segments_list`
- `POST /api/segments` → `klaviyo_segments_create`
- `GET /api/segments/{id}` → `klaviyo_segments_get`
- `PATCH /api/segments/{id}` → `klaviyo_segments_update`
- `DELETE /api/segments/{id}` → `klaviyo_segments_delete`
- `GET /api/segments/{id}/tags` → `klaviyo_segments_get_tags`
- `GET /api/segments/{id}/profiles` → `klaviyo_segments_get_profiles`
- `GET /api/segments/{id}/flow-triggers` → `klaviyo_segments_get_flow_triggers`

#### ❌ Missing
- `GET /api/segments/{id}/relationships/tags`
- `GET /api/segments/{id}/relationships/profiles`
- `GET /api/segments/{id}/relationships/flow-triggers`

---

### 📝 Templates (12 endpoints) - ~75% Coverage

#### ✅ Implemented
- `GET /api/templates` → `klaviyo_templates_list`
- `POST /api/templates` → `klaviyo_templates_create`
- `GET /api/templates/{id}` → `klaviyo_templates_get`
- `PATCH /api/templates/{id}` → `klaviyo_templates_update`
- `DELETE /api/templates/{id}` → `klaviyo_templates_delete`
- `GET /api/template-universal-content` → `klaviyo_templates_get_universal_content`
- `POST /api/template-render` → `klaviyo_templates_render`
- `POST /api/template-clone` → `klaviyo_templates_clone`
- (get tags via relationship)

#### ❌ Missing
- `POST /api/template-universal-content` - Create universal content
- `GET /api/template-universal-content/{id}` - Get universal content
- `PATCH /api/template-universal-content/{id}` - Update universal content
- `DELETE /api/template-universal-content/{id}` - Delete universal content

---

## 🔴 HIGH PRIORITY - Missing Categories

### Flows (20 endpoints) - 0% Coverage

Flows are Klaviyo's automated email sequences. **Critical for automation.**

```
GET    /api/flows                        - List all flows
POST   /api/flows                        - Create flow
GET    /api/flows/{id}                   - Get flow
PATCH  /api/flows/{id}                   - Update flow (enable/disable)
DELETE /api/flows/{id}                   - Delete flow
GET    /api/flow-actions/{id}            - Get flow action
PATCH  /api/flow-actions/{id}            - Update flow action
GET    /api/flow-messages/{id}           - Get flow message
GET    /api/flows/{id}/flow-actions      - Get flow's actions
GET    /api/flows/{id}/tags              - Get flow's tags
GET    /api/flow-actions/{id}/flow       - Get action's flow
GET    /api/flow-actions/{id}/flow-messages - Get action's messages
GET    /api/flow-messages/{id}/flow-action  - Get message's action
GET    /api/flow-messages/{id}/template  - Get message's template
+ 6 relationship endpoints
```

**Recommended Tools:**
- `klaviyo_flows_list` - List all flows
- `klaviyo_flows_get` - Get flow details
- `klaviyo_flows_create` - Create new flow
- `klaviyo_flows_update` - Update flow (enable/disable/archive)
- `klaviyo_flows_delete` - Delete flow
- `klaviyo_flows_get_actions` - Get flow actions
- `klaviyo_flows_get_action` - Get specific action
- `klaviyo_flows_update_action` - Update action
- `klaviyo_flows_get_message` - Get flow message
- `klaviyo_flows_get_tags` - Get flow tags

---

### Catalogs (55 endpoints) - 0% Coverage

Catalogs are essential for e-commerce: products, variants, categories.

```
# Items (5 CRUD + 9 bulk + 3 relationships)
GET    /api/catalog-items
POST   /api/catalog-items
GET    /api/catalog-items/{id}
PATCH  /api/catalog-items/{id}
DELETE /api/catalog-items/{id}
GET/POST /api/catalog-item-bulk-create-jobs
GET/POST /api/catalog-item-bulk-update-jobs
GET/POST /api/catalog-item-bulk-delete-jobs

# Variants (5 CRUD + 9 bulk)
GET    /api/catalog-variants
POST   /api/catalog-variants
GET    /api/catalog-variants/{id}
PATCH  /api/catalog-variants/{id}
DELETE /api/catalog-variants/{id}
+ bulk jobs

# Categories (5 CRUD + 9 bulk + 5 relationships)
GET    /api/catalog-categories
POST   /api/catalog-categories
GET    /api/catalog-categories/{id}
PATCH  /api/catalog-categories/{id}
DELETE /api/catalog-categories/{id}
+ bulk jobs

# Back in Stock
POST   /api/back-in-stock-subscriptions
```

**Recommended Tools (Phase 1):**
- `klaviyo_catalogs_list_items` - List catalog items
- `klaviyo_catalogs_get_item` - Get item details
- `klaviyo_catalogs_create_item` - Create item
- `klaviyo_catalogs_update_item` - Update item
- `klaviyo_catalogs_delete_item` - Delete item
- `klaviyo_catalogs_list_variants` - List variants
- `klaviyo_catalogs_get_variant` - Get variant
- `klaviyo_catalogs_list_categories` - List categories
- `klaviyo_catalogs_get_category` - Get category
- `klaviyo_catalogs_bulk_create_items` - Bulk create items

---

## 🟡 MEDIUM PRIORITY - Missing Categories

### Tags (26 endpoints) - 0% Coverage

Tags help organize campaigns, flows, lists, and segments.

```
GET    /api/tags                         - List tags
POST   /api/tags                         - Create tag
GET    /api/tags/{id}                    - Get tag
PATCH  /api/tags/{id}                    - Update tag
DELETE /api/tags/{id}                    - Delete tag
GET    /api/tag-groups                   - List tag groups
POST   /api/tag-groups                   - Create tag group
GET    /api/tag-groups/{id}              - Get tag group
PATCH  /api/tag-groups/{id}              - Update tag group
DELETE /api/tag-groups/{id}              - Delete tag group
+ relationship management endpoints
```

**Recommended Tools:**
- `klaviyo_tags_list` - List all tags
- `klaviyo_tags_create` - Create tag
- `klaviyo_tags_get` - Get tag
- `klaviyo_tags_update` - Update tag
- `klaviyo_tags_delete` - Delete tag
- `klaviyo_tags_list_groups` - List tag groups
- `klaviyo_tags_add_to_campaign` - Tag a campaign
- `klaviyo_tags_add_to_flow` - Tag a flow
- `klaviyo_tags_add_to_list` - Tag a list
- `klaviyo_tags_add_to_segment` - Tag a segment

---

### Coupons (17 endpoints) - 0% Coverage

Coupons for discounts and promotions.

```
GET    /api/coupons                      - List coupons
POST   /api/coupons                      - Create coupon
GET    /api/coupons/{id}                 - Get coupon
PATCH  /api/coupons/{id}                 - Update coupon
DELETE /api/coupons/{id}                 - Delete coupon
GET    /api/coupon-codes                 - List codes
POST   /api/coupon-codes                 - Create code
GET    /api/coupon-codes/{id}            - Get code
PATCH  /api/coupon-codes/{id}            - Update code
DELETE /api/coupon-codes/{id}            - Delete code
+ bulk create jobs
```

**Recommended Tools:**
- `klaviyo_coupons_list` - List coupons
- `klaviyo_coupons_create` - Create coupon
- `klaviyo_coupons_get` - Get coupon
- `klaviyo_coupons_update` - Update coupon
- `klaviyo_coupons_delete` - Delete coupon
- `klaviyo_coupons_list_codes` - List coupon codes
- `klaviyo_coupons_create_codes` - Create coupon codes
- `klaviyo_coupons_bulk_create_codes` - Bulk create codes

---

### Webhooks (7 endpoints) - 0% Coverage

Webhooks for real-time event notifications.

```
GET    /api/webhooks                     - List webhooks
POST   /api/webhooks                     - Create webhook
GET    /api/webhooks/{id}                - Get webhook
PATCH  /api/webhooks/{id}                - Update webhook
DELETE /api/webhooks/{id}                - Delete webhook
GET    /api/webhook-topics               - List topics
GET    /api/webhook-topics/{id}          - Get topic
```

**Recommended Tools:**
- `klaviyo_webhooks_list` - List webhooks
- `klaviyo_webhooks_create` - Create webhook
- `klaviyo_webhooks_get` - Get webhook
- `klaviyo_webhooks_update` - Update webhook
- `klaviyo_webhooks_delete` - Delete webhook
- `klaviyo_webhooks_list_topics` - List available topics

---

### Images (5 endpoints) - 0% Coverage

Image management for email content.

```
GET    /api/images                       - List images
POST   /api/images                       - Create image (from URL)
GET    /api/images/{id}                  - Get image
PATCH  /api/images/{id}                  - Update image
POST   /api/image-upload                 - Upload image file
```

**Recommended Tools:**
- `klaviyo_images_list` - List images
- `klaviyo_images_create` - Create image from URL
- `klaviyo_images_get` - Get image details
- `klaviyo_images_update` - Update image metadata
- `klaviyo_images_upload` - Upload image file

---

### Reporting (7 endpoints) - 0% Coverage

Advanced reporting endpoints.

```
POST   /api/campaign-values-reports      - Campaign metrics report (partial via campaigns)
POST   /api/flow-values-reports          - Flow metrics report
POST   /api/flow-series-reports          - Flow timeseries report
POST   /api/form-values-reports          - Form metrics report
POST   /api/form-series-reports          - Form timeseries report
POST   /api/segment-values-reports       - Segment metrics report
POST   /api/segment-series-reports       - Segment timeseries report
```

**Recommended Tools:**
- `klaviyo_reports_flow_values` - Flow performance report
- `klaviyo_reports_flow_series` - Flow timeseries
- `klaviyo_reports_segment_values` - Segment performance
- `klaviyo_reports_segment_series` - Segment timeseries

---

## 🟢 LOW PRIORITY - Missing Categories

### Forms (9 endpoints)
- List/get forms and form versions
- Useful for lead capture analytics

### Custom Objects (6 endpoints)
- Data sources for custom object storage
- Advanced feature for complex data models

### Accounts (2 endpoints)
- Get account info
- Useful for multi-account setups

### Data Privacy (1 endpoint)
- `POST /api/data-privacy-deletion-jobs`
- GDPR compliance for data deletion

### Reviews (3 endpoints)
- Product reviews management
- Requires Reviews product

### Tracking Settings (3 endpoints)
- Email tracking configuration
- Usually set once

### Web Feeds (5 endpoints)
- RSS/Atom feed management
- Niche use case

---

## Implementation Roadmap

### Phase 4: Flows & Tags (HIGH Priority)
**Estimated Tools:** 15-20  
**Effort:** Medium  
**Business Value:** High (Automation & Organization)

1. Flows CRUD + actions + messages
2. Tags CRUD + tag groups
3. Tag relationship management

### Phase 5: Catalogs (HIGH Priority)
**Estimated Tools:** 20-25  
**Effort:** High  
**Business Value:** High (E-commerce)

1. Catalog items CRUD + bulk
2. Variants CRUD + bulk
3. Categories CRUD + bulk
4. Back in stock subscriptions

### Phase 6: Coupons & Webhooks (MEDIUM Priority)
**Estimated Tools:** 12-15  
**Effort:** Medium  
**Business Value:** Medium

1. Coupons CRUD + codes
2. Webhooks CRUD + topics

### Phase 7: Images & Reporting (MEDIUM Priority)
**Estimated Tools:** 8-10  
**Effort:** Low-Medium  
**Business Value:** Medium

1. Images CRUD + upload
2. Advanced reporting endpoints

### Phase 8: Remaining (LOW Priority)
**Estimated Tools:** 10-15  
**Effort:** Low  
**Business Value:** Low-Medium

1. Forms (read-only)
2. Accounts
3. Data Privacy
4. Custom Objects
5. Reviews
6. Tracking Settings
7. Web Feeds

---

## Summary

| Phase | Category | Tools | Priority | Status |
|-------|----------|-------|----------|--------|
| 1-3 | Core (Profiles, Lists, Campaigns, Events, Metrics, Segments, Templates) | 77 | ✅ DONE | Complete |
| 4 | Flows & Tags | ~18 | 🔴 HIGH | Planned |
| 5 | Catalogs | ~23 | 🔴 HIGH | Planned |
| 6 | Coupons & Webhooks | ~14 | 🟡 MEDIUM | Planned |
| 7 | Images & Reporting | ~10 | 🟡 MEDIUM | Planned |
| 8 | Remaining | ~13 | 🟢 LOW | Planned |

**Total Projected:** ~155 tools covering ~95% of server-side API

---

## Current State vs Target

```
Current:  ████████░░░░░░░░░░░░░░░░░░░░░░  77 tools (22%)
Phase 4:  ████████████░░░░░░░░░░░░░░░░░░  95 tools (31%)
Phase 5:  ██████████████████░░░░░░░░░░░░  118 tools (40%)
Phase 6:  ██████████████████████░░░░░░░░  132 tools (45%)
Phase 7:  ████████████████████████░░░░░░  142 tools (48%)
Phase 8:  ██████████████████████████░░░░  155 tools (~53%)
```

> Note: 53% tool coverage maps to ~95% of commonly used API functionality.
> Client-side APIs (10 endpoints) are not applicable for server-side MCP.
> Many relationship endpoints are low-value and can be skipped.
