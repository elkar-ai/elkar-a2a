/* tslint:disable */
/* eslint-disable */
/**
 * elkar-app
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
/**
 * File data for file parts
 * @export
 * @interface FileData
 */
export interface FileData {
    /**
     * 
     * @type {string}
     * @memberof FileData
     */
    bytes?: string | null;
    /**
     * 
     * @type {string}
     * @memberof FileData
     */
    mimeType?: string | null;
    /**
     * 
     * @type {string}
     * @memberof FileData
     */
    name?: string | null;
    /**
     * 
     * @type {string}
     * @memberof FileData
     */
    uri?: string | null;
}

/**
 * Check if a given object implements the FileData interface.
 */
export function instanceOfFileData(value: object): value is FileData {
    return true;
}

export function FileDataFromJSON(json: any): FileData {
    return FileDataFromJSONTyped(json, false);
}

export function FileDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): FileData {
    if (json == null) {
        return json;
    }
    return {
        
        'bytes': json['bytes'] == null ? undefined : json['bytes'],
        'mimeType': json['mime_type'] == null ? undefined : json['mime_type'],
        'name': json['name'] == null ? undefined : json['name'],
        'uri': json['uri'] == null ? undefined : json['uri'],
    };
}

export function FileDataToJSON(json: any): FileData {
    return FileDataToJSONTyped(json, false);
}

export function FileDataToJSONTyped(value?: FileData | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'bytes': value['bytes'],
        'mime_type': value['mimeType'],
        'name': value['name'],
        'uri': value['uri'],
    };
}

