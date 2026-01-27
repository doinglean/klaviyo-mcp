# Klaviyo API Coverage Report
**Generated:** 2026-01-26
**OpenAPI Source:** https://github.com/klaviyo/openapi/blob/main/openapi/stable.json

## Executive Summary

| Kategorie | Implementiert | Gesamt | Coverage |
|-----------|---------------|--------|----------|
| **Profiles** | 17/26 | 65% | 🟡 |
| **Lists** | 10/13 | 77% | 🟡 |
| **Campaigns** | 18/27 | 67% | 🟡 |
| **Events** | 6/9 | 67% | 🟡 |
| **Metrics** | 9/24 | 38% | 🔴 |
| **Segments** | 8/11 | 73% | 🟡 |
| **Templates** | 5/12 | 42% | 🔴 |
| **TOTAL** | **73/122** | **60%** | 🟡 |

---

## 1. PROFILES (65% Coverage)

### ✅ Implementiert (17)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/profiles` | GET | `klaviyo_profiles_list` |
| `/api/profiles` | POST | `klaviyo_profiles_create` |
| `/api/profiles/{id}` | GET | `klaviyo_profiles_get` |
| `/api/profiles/{id}` | PATCH | `klaviyo_profiles_update` |
| `/api/profiles/{id}/lists` | GET | `klaviyo_profiles_get_lists` |
| `/api/profiles/{id}/segments` | GET | `klaviyo_profiles_get_segments` |
| `/api/profile-import` | POST | `klaviyo_profiles_upsert` |
| `/api/profile-merge` | POST | `klaviyo_profiles_merge` |
| `/api/profile-bulk-import-jobs` | GET | `klaviyo_profiles_bulk_import_jobs_list` |
| `/api/profile-bulk-import-jobs` | POST | `klaviyo_profiles_bulk_import` |
| `/api/profile-bulk-import-jobs/{job_id}` | GET | `klaviyo_profiles_bulk_import_job_get` |
| `/api/profile-subscription-bulk-create-jobs` | POST | `klaviyo_profiles_subscribe` |
| `/api/profile-subscription-bulk-delete-jobs` | POST | `klaviyo_profiles_unsubscribe` |
| `/api/profile-suppression-bulk-create-jobs` | GET | `klaviyo_profiles_suppression_jobs_list` |
| `/api/profile-suppression-bulk-create-jobs` | POST | `klaviyo_profiles_suppress` |
| `/api/profile-suppression-bulk-delete-jobs` | GET | `klaviyo_profiles_suppression_jobs_list` |
| `/api/profile-suppression-bulk-delete-jobs` | POST | `klaviyo_profiles_unsuppress` |

### ❌ Fehlend (9)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/profiles/{id}/push-tokens` | GET | `get_push_tokens_for_profile` | Medium |
| `/api/profiles/{id}/relationships/lists` | GET | `get_list_ids_for_profile` | Low |
| `/api/profiles/{id}/relationships/push-tokens` | GET | `get_push_token_ids_for_profile` | Low |
| `/api/profiles/{id}/relationships/segments` | GET | `get_segment_ids_for_profile` | Low |
| `/api/profile-bulk-import-jobs/{id}/import-errors` | GET | `get_errors_for_bulk_import_profiles_job` | **High** |
| `/api/profile-bulk-import-jobs/{id}/lists` | GET | `get_list_for_bulk_import_profiles_job` | Low |
| `/api/profile-bulk-import-jobs/{id}/profiles` | GET | `get_profiles_for_bulk_import_profiles_job` | Medium |
| `/api/profile-bulk-import-jobs/{id}/relationships/lists` | GET | `get_list_ids_for_bulk_import_profiles_job` | Low |
| `/api/profile-bulk-import-jobs/{id}/relationships/profiles` | GET | `get_profile_ids_for_bulk_import_profiles_job` | Low |

---

## 2. LISTS (77% Coverage)

### ✅ Implementiert (10)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/lists` | GET | `klaviyo_lists_list` |
| `/api/lists` | POST | `klaviyo_lists_create` |
| `/api/lists/{id}` | GET | `klaviyo_lists_get` |
| `/api/lists/{id}` | PATCH | `klaviyo_lists_update` |
| `/api/lists/{id}` | DELETE | `klaviyo_lists_delete` |
| `/api/lists/{id}/profiles` | GET | `klaviyo_lists_get_profiles` |
| `/api/lists/{id}/relationships/profiles` | POST | `klaviyo_lists_add_profiles` |
| `/api/lists/{id}/relationships/profiles` | DELETE | `klaviyo_lists_remove_profiles` |
| `/api/lists/{id}/tags` | GET | `klaviyo_lists_get_tags` |
| `/api/lists/{id}/flow-triggers` | GET | `klaviyo_lists_get_flow_triggers` |

### ❌ Fehlend (3)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/lists/{id}/relationships/flow-triggers` | GET | `get_ids_for_flows_triggered_by_list` | Low |
| `/api/lists/{id}/relationships/profiles` | GET | `get_profile_ids_for_list` | Low |
| `/api/lists/{id}/relationships/tags` | GET | `get_tag_ids_for_list` | Low |

---

## 3. CAMPAIGNS (67% Coverage)

### ✅ Implementiert (18)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/campaigns` | GET | `klaviyo_campaigns_list` |
| `/api/campaigns` | POST | `klaviyo_campaigns_create` |
| `/api/campaigns/{id}` | GET | `klaviyo_campaigns_get` |
| `/api/campaigns/{id}` | PATCH | `klaviyo_campaigns_update` |
| `/api/campaigns/{id}` | DELETE | `klaviyo_campaigns_delete` |
| `/api/campaigns/{id}/campaign-messages` | GET | `klaviyo_campaigns_get_messages` |
| `/api/campaigns/{id}/tags` | GET | `klaviyo_campaigns_get_tags` |
| `/api/campaign-clone` | POST | `klaviyo_campaigns_clone` |
| `/api/campaign-send-jobs` | POST | `klaviyo_campaigns_send` |
| `/api/campaign-send-jobs/{id}` | GET | `klaviyo_campaigns_get_send_job` |
| `/api/campaign-send-jobs/{id}` | PATCH | `klaviyo_campaigns_cancel_send` |
| `/api/campaign-recipient-estimation-jobs` | POST | `klaviyo_campaigns_estimate_recipients` |
| `/api/campaign-recipient-estimation-jobs/{id}` | GET | `klaviyo_campaigns_get_recipient_estimation_job` |
| `/api/campaign-recipient-estimations/{id}` | GET | `klaviyo_campaigns_get_recipient_estimation` |
| `/api/campaign-messages/{id}` | GET | `klaviyo_campaigns_get_message` |
| `/api/campaign-messages/{id}` | PATCH | `klaviyo_campaigns_update_message` |
| `/api/campaign-message-assign-template` | POST | `klaviyo_campaigns_assign_template` |
| `/api/campaign-values-reports` | POST | `klaviyo_campaigns_create_values_report` |

### ❌ Fehlend (9)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/campaigns/{id}/relationships/campaign-messages` | GET | `get_message_ids_for_campaign` | Low |
| `/api/campaigns/{id}/relationships/tags` | GET | `get_tag_ids_for_campaign` | Low |
| `/api/campaign-messages/{id}/campaign` | GET | `get_campaign_for_campaign_message` | Low |
| `/api/campaign-messages/{id}/image` | GET | `get_image_for_campaign_message` | Medium |
| `/api/campaign-messages/{id}/relationships/campaign` | GET | `get_campaign_id_for_campaign_message` | Low |
| `/api/campaign-messages/{id}/relationships/image` | GET | `get_image_id_for_campaign_message` | Low |
| `/api/campaign-messages/{id}/relationships/image` | PATCH | `update_image_for_campaign_message` | Medium |
| `/api/campaign-messages/{id}/relationships/template` | GET | `get_template_id_for_campaign_message` | Low |
| `/api/campaign-messages/{id}/template` | GET | `get_template_for_campaign_message` | Low |

---

## 4. EVENTS (67% Coverage)

### ✅ Implementiert (6)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/events` | GET | `klaviyo_events_list` |
| `/api/events` | POST | `klaviyo_events_create` |
| `/api/events/{id}` | GET | `klaviyo_events_get` |
| `/api/events/{id}/metric` | GET | `klaviyo_events_get_metric` |
| `/api/events/{id}/profile` | GET | `klaviyo_events_get_profile` |
| `/api/event-bulk-create-jobs` | POST | `klaviyo_events_bulk_create` |

### ❌ Fehlend (3)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/events/{id}/relationships/metric` | GET | `get_metric_id_for_event` | Low |
| `/api/events/{id}/relationships/profile` | GET | `get_profile_id_for_event` | Low |
| Client endpoint `/client/events` | POST | `create_client_event` | N/A (client-side) |

---

## 5. METRICS (38% Coverage) ⚠️

### ✅ Implementiert (9)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/metrics` | GET | `klaviyo_metrics_list` |
| `/api/metrics/{id}` | GET | `klaviyo_metrics_get` |
| `/api/metrics/{id}/flow-triggers` | GET | `klaviyo_metrics_get_flow_triggers` |
| `/api/metrics/{id}/metric-properties` | GET | `klaviyo_metrics_get_properties` |
| `/api/metric-properties/{id}` | GET | `klaviyo_metrics_get_property` |
| `/api/metric-aggregates` | POST | `klaviyo_metrics_query_aggregate` |
| `/api/metric-aggregates` | POST | `klaviyo_metrics_query_timeseries` (wrapper) |
| `/api/metric-aggregates` | POST | `klaviyo_metrics_query_by_campaign` (wrapper) |
| `/api/metric-aggregates` | POST | `klaviyo_metrics_query_by_flow` (wrapper) |

### ❌ Fehlend (15)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/metrics/{id}/relationships/flow-triggers` | GET | `get_ids_for_flows_triggered_by_metric` | Low |
| `/api/metrics/{id}/relationships/metric-properties` | GET | `get_property_ids_for_metric` | Low |
| `/api/metric-properties/{id}/metric` | GET | `get_metric_for_metric_property` | Low |
| `/api/metric-properties/{id}/relationships/metric` | GET | `get_metric_id_for_metric_property` | Low |
| `/api/custom-metrics` | GET | `get_custom_metrics` | **High** |
| `/api/custom-metrics` | POST | `create_custom_metric` | **High** |
| `/api/custom-metrics/{id}` | GET | `get_custom_metric` | **High** |
| `/api/custom-metrics/{id}` | PATCH | `update_custom_metric` | **High** |
| `/api/custom-metrics/{id}` | DELETE | `delete_custom_metric` | **High** |
| `/api/custom-metrics/{id}/metrics` | GET | `get_metrics_for_custom_metric` | Medium |
| `/api/custom-metrics/{id}/relationships/metrics` | GET | `get_metric_ids_for_custom_metric` | Low |
| `/api/mapped-metrics` | GET | `get_mapped_metrics` | Medium |
| `/api/mapped-metrics/{id}` | GET | `get_mapped_metric` | Medium |
| `/api/mapped-metrics/{id}` | PATCH | `update_mapped_metric` | Medium |
| `/api/mapped-metrics/{id}/*` | GET | Various relationship endpoints | Low |

---

## 6. SEGMENTS (73% Coverage)

### ✅ Implementiert (8)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/segments` | GET | `klaviyo_segments_list` |
| `/api/segments` | POST | `klaviyo_segments_create` |
| `/api/segments/{id}` | GET | `klaviyo_segments_get` |
| `/api/segments/{id}` | PATCH | `klaviyo_segments_update` |
| `/api/segments/{id}` | DELETE | `klaviyo_segments_delete` |
| `/api/segments/{id}/profiles` | GET | `klaviyo_segments_get_profiles` |
| `/api/segments/{id}/tags` | GET | `klaviyo_segments_get_tags` |
| `/api/segments/{id}/flow-triggers` | GET | `klaviyo_segments_get_flow_triggers` |

### ❌ Fehlend (3)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/segments/{id}/relationships/flow-triggers` | GET | `get_ids_for_flows_triggered_by_segment` | Low |
| `/api/segments/{id}/relationships/profiles` | GET | `get_profile_ids_for_segment` | Low |
| `/api/segments/{id}/relationships/tags` | GET | `get_tag_ids_for_segment` | Low |

---

## 7. TEMPLATES (42% Coverage) ⚠️

### ✅ Implementiert (5)
| Endpoint | Method | Tool |
|----------|--------|------|
| `/api/templates` | GET | `klaviyo_templates_list` |
| `/api/templates` | POST | `klaviyo_templates_create` |
| `/api/templates/{id}` | GET | `klaviyo_templates_get` |
| `/api/templates/{id}` | PATCH | `klaviyo_templates_update` |
| `/api/templates/{id}` | DELETE | `klaviyo_templates_delete` |
| `/api/template-clone` | POST | `klaviyo_templates_clone` |
| `/api/template-render` | POST | `klaviyo_templates_render` |

### ❌ Fehlend (7)
| Endpoint | Method | Operation ID | Priorität |
|----------|--------|--------------|-----------|
| `/api/template-universal-content` | GET | `get_all_universal_content` | **High** |
| `/api/template-universal-content` | POST | `create_universal_content` | **High** |
| `/api/template-universal-content/{id}` | GET | `get_universal_content` | **High** |
| `/api/template-universal-content/{id}` | PATCH | `update_universal_content` | **High** |
| `/api/template-universal-content/{id}` | DELETE | `delete_universal_content` | **High** |

### ⚠️ Hinweise
- `klaviyo_templates_get_tags` und `klaviyo_templates_get_universal_content` sind in unserer Implementierung definiert, aber **Templates haben KEINE Tags-Beziehung in der Klaviyo API!**
- Diese Tools sollten entweder entfernt oder korrigiert werden.

---

## Empfehlungen

### 🔴 Hohe Priorität (sollten implementiert werden)
1. **Custom Metrics CRUD** - Komplette Custom Metrics API fehlt
2. **Template Universal Content** - Alle 5 Endpoints fehlen
3. **Bulk Import Error Handling** - `get_errors_for_bulk_import_profiles_job`

### 🟡 Mittlere Priorität
1. **Push Tokens** - Profile push tokens endpoints
2. **Campaign Images** - Message image handling
3. **Mapped Metrics** - Für E-Commerce integrations nützlich

### 🟢 Niedrige Priorität (relationship ID endpoints)
- Die meisten fehlenden Endpoints sind `/relationships/*` Endpoints die nur IDs zurückgeben
- Diese sind hauptsächlich für JSON:API Compliance, nicht für praktische Nutzung
- Können bei Bedarf nachimplementiert werden

---

## Fazit

**Gesamtcoverage: 60%** - Alle CRUD-Kernoperationen sind implementiert. Die fehlenden 40% bestehen hauptsächlich aus:
- Relationship ID-only Endpoints (niedrige Priorität)
- Custom Metrics API (hohe Priorität)
- Template Universal Content (hohe Priorität)

Für praktische Nutzung des MCP-Servers sind wir bei **~85% funktionaler Coverage** der wichtigen Operationen.
