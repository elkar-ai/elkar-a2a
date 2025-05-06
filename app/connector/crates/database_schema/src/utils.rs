use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

pub fn list_enum_to_string<T: Serialize>(list: &[T]) -> Vec<String> {
    list.iter()
        .map(|item| {
            let i = serde_json::to_value(item).unwrap();
            if let Value::String(s) = i {
                s
            } else {
                panic!("Failed to convert enum to string")
            }
        })
        .collect()
}

pub fn enum_to_string<T: Serialize>(enum_value: T) -> String {
    let i = serde_json::to_value(&enum_value).unwrap();
    if let Value::String(s) = i {
        s
    } else {
        panic!("Failed to convert enum to string")
    }
}
pub fn list_string_to_enum<T: DeserializeOwned>(
    list: &[String],
) -> Result<Vec<T>, serde_json::Error> {
    list.iter()
        .map(|item| {
            let formatted_item = format!("\"{}\"", item);
            serde_json::from_str(&formatted_item)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize, Debug, PartialEq)]
    pub enum TestEnum {
        Test1,
        Test2,
    }

    #[test]
    fn test_list_enum_to_string() {
        let list = vec![TestEnum::Test1, TestEnum::Test2];
        let result = list_enum_to_string(&list);
        assert_eq!(result, vec!["Test1".to_string(), "Test2".to_string()]);
    }

    #[test]
    fn test_list_string_to_enum() {
        let list = vec!["Test1".to_string(), "Test2".to_string()];
        let result = list_string_to_enum::<TestEnum>(&list).unwrap();
        assert_eq!(result, vec![TestEnum::Test1, TestEnum::Test2]);
    }
}
