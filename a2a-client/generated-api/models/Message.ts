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
import type { Role } from './Role';
import {
    RoleFromJSON,
    RoleFromJSONTyped,
    RoleToJSON,
    RoleToJSONTyped,
} from './Role';
import type { Part } from './Part';
import {
    PartFromJSON,
    PartFromJSONTyped,
    PartToJSON,
    PartToJSONTyped,
} from './Part';

/**
 * Message structure as per A2A specification
 * @export
 * @interface Message
 */
export interface Message {
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof Message
     */
    metadata?: { [key: string]: any; };
    /**
     * 
     * @type {Array<Part>}
     * @memberof Message
     */
    parts: Array<Part>;
    /**
     * 
     * @type {Role}
     * @memberof Message
     */
    role: Role;
}



/**
 * Check if a given object implements the Message interface.
 */
export function instanceOfMessage(value: object): value is Message {
    if (!('parts' in value) || value['parts'] === undefined) return false;
    if (!('role' in value) || value['role'] === undefined) return false;
    return true;
}

export function MessageFromJSON(json: any): Message {
    return MessageFromJSONTyped(json, false);
}

export function MessageFromJSONTyped(json: any, ignoreDiscriminator: boolean): Message {
    if (json == null) {
        return json;
    }
    return {
        
        'metadata': json['metadata'] == null ? undefined : json['metadata'],
        'parts': ((json['parts'] as Array<any>).map(PartFromJSON)),
        'role': RoleFromJSON(json['role']),
    };
}

export function MessageToJSON(json: any): Message {
    return MessageToJSONTyped(json, false);
}

export function MessageToJSONTyped(value?: Message | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'metadata': value['metadata'],
        'parts': ((value['parts'] as Array<any>).map(PartToJSON)),
        'role': RoleToJSON(value['role']),
    };
}

