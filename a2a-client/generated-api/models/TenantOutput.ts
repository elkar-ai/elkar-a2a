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
 * 
 * @export
 * @interface TenantOutput
 */
export interface TenantOutput {
    /**
     * 
     * @type {string}
     * @memberof TenantOutput
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof TenantOutput
     */
    name: string;
}

/**
 * Check if a given object implements the TenantOutput interface.
 */
export function instanceOfTenantOutput(value: object): value is TenantOutput {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('name' in value) || value['name'] === undefined) return false;
    return true;
}

export function TenantOutputFromJSON(json: any): TenantOutput {
    return TenantOutputFromJSONTyped(json, false);
}

export function TenantOutputFromJSONTyped(json: any, ignoreDiscriminator: boolean): TenantOutput {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'name': json['name'],
    };
}

export function TenantOutputToJSON(json: any): TenantOutput {
    return TenantOutputToJSONTyped(json, false);
}

export function TenantOutputToJSONTyped(value?: TenantOutput | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'name': value['name'],
    };
}

