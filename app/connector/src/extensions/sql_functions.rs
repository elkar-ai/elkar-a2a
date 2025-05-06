use diesel::{
    define_sql_function,
    sql_types::{Nullable, SingleValue, Text, Timestamp},
};
use sea_query::{Iden, Write};

define_sql_function!(fn date_trunc(interval: Text, timestamp: Timestamp) -> Timestamp);

define_sql_function!(fn date(timestamp: Timestamp) -> Date);

define_sql_function! {
    #[aggregate]
    #[sql_name = "ARRAY_AGG"]
    fn array_agg<T:SingleValue>(expr: T) -> Array<T>;
}
define_sql_function! {fn coalesce<T:SingleValue>(x:Nullable<T>,y:T) -> T;}

// SeaQuery
pub struct ArrayAgg;

impl Iden for ArrayAgg {
    fn unquoted(&self, s: &mut dyn Write) {
        write!(s, "ARRAY_AGG").unwrap();
    }
}

pub struct Format;

impl Iden for Format {
    fn unquoted(&self, s: &mut dyn Write) {
        write!(s, "FORMAT").unwrap();
    }
}

pub struct JsonBObject;

impl Iden for JsonBObject {
    fn unquoted(&self, s: &mut dyn Write) {
        write!(s, "JSONB_OBJECT").unwrap();
    }
}

pub struct BoolOr;

impl Iden for BoolOr {
    fn unquoted(&self, s: &mut dyn Write) {
        write!(s, "BOOL_OR").unwrap();
    }
}

pub struct AnyValue;

impl Iden for AnyValue {
    fn unquoted(&self, s: &mut dyn Write) {
        write!(s, "ANY_VALUE").unwrap();
    }
}
