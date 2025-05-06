diesel::table! {
    use diesel::sql_types::*;

    detector_statistics (tenant_id, detector_id) {
        tenant_id -> Uuid,
        detector_id -> Uuid,
        occurences_count -> Int8,
        data_asset_count -> Int8,
    }
}

diesel::table! {
    data_store_statistics (tenant_id, data_store_id) {
        tenant_id -> Uuid,
        data_store_id -> Uuid,
        total_occurences -> Int8,
        total_assets -> Int8,
    }
}

diesel::table! {
    data_asset_stats_per_identity (id) {
        id -> Uuid,
        data_asset_count -> Int8,
        sensitivity_count -> Int8,
    }
}
