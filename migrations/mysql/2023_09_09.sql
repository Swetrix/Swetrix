alter table alert modify column `queryMetric` enum('page_views','unique_page_views','online_users','custom_events') DEFAULT NULL after lastTriggered;
alter table alert add column `queryCustomEvent` varchar(255) DEFAULT NULL after queryTime;
