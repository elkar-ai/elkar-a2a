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
import type { ApplicationUserStatus } from './ApplicationUserStatus';
import {
    ApplicationUserStatusFromJSON,
    ApplicationUserStatusFromJSONTyped,
    ApplicationUserStatusToJSON,
    ApplicationUserStatusToJSONTyped,
} from './ApplicationUserStatus';

/**
 * 
 * @export
 * @interface UnpaginatedOutputApplicationUserOutputRecordsInner
 */
export interface UnpaginatedOutputApplicationUserOutputRecordsInner {
    /**
     * 
     * @type {string}
     * @memberof UnpaginatedOutputApplicationUserOutputRecordsInner
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof UnpaginatedOutputApplicationUserOutputRecordsInner
     */
    firstName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof UnpaginatedOutputApplicationUserOutputRecordsInner
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof UnpaginatedOutputApplicationUserOutputRecordsInner
     */
    lastName?: string | null;
    /**
     * 
     * @type {ApplicationUserStatus}
     * @memberof UnpaginatedOutputApplicationUserOutputRecordsInner
     */
    status: ApplicationUserStatus;
}



/**
 * Check if a given object implements the UnpaginatedOutputApplicationUserOutputRecordsInner interface.
 */
export function instanceOfUnpaginatedOutputApplicationUserOutputRecordsInner(value: object): value is UnpaginatedOutputApplicationUserOutputRecordsInner {
    if (!('email' in value) || value['email'] === undefined) return false;
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('status' in value) || value['status'] === undefined) return false;
    return true;
}

export function UnpaginatedOutputApplicationUserOutputRecordsInnerFromJSON(json: any): UnpaginatedOutputApplicationUserOutputRecordsInner {
    return UnpaginatedOutputApplicationUserOutputRecordsInnerFromJSONTyped(json, false);
}

export function UnpaginatedOutputApplicationUserOutputRecordsInnerFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnpaginatedOutputApplicationUserOutputRecordsInner {
    if (json == null) {
        return json;
    }
    return {
        
        'email': json['email'],
        'firstName': json['first_name'] == null ? undefined : json['first_name'],
        'id': json['id'],
        'lastName': json['last_name'] == null ? undefined : json['last_name'],
        'status': ApplicationUserStatusFromJSON(json['status']),
    };
}

export function UnpaginatedOutputApplicationUserOutputRecordsInnerToJSON(json: any): UnpaginatedOutputApplicationUserOutputRecordsInner {
    return UnpaginatedOutputApplicationUserOutputRecordsInnerToJSONTyped(json, false);
}

export function UnpaginatedOutputApplicationUserOutputRecordsInnerToJSONTyped(value?: UnpaginatedOutputApplicationUserOutputRecordsInner | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'email': value['email'],
        'first_name': value['firstName'],
        'id': value['id'],
        'last_name': value['lastName'],
        'status': ApplicationUserStatusToJSON(value['status']),
    };
}

