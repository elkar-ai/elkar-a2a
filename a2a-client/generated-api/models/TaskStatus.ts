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
import type { Message } from './Message';
import {
    MessageFromJSON,
    MessageFromJSONTyped,
    MessageToJSON,
    MessageToJSONTyped,
} from './Message';
import type { TaskState } from './TaskState';
import {
    TaskStateFromJSON,
    TaskStateFromJSONTyped,
    TaskStateToJSON,
    TaskStateToJSONTyped,
} from './TaskState';

/**
 * Task status as per A2A specification
 * @export
 * @interface TaskStatus
 */
export interface TaskStatus {
    /**
     * 
     * @type {Message}
     * @memberof TaskStatus
     */
    message?: Message | null;
    /**
     * 
     * @type {TaskState}
     * @memberof TaskStatus
     */
    state: TaskState;
    /**
     * 
     * @type {string}
     * @memberof TaskStatus
     */
    timestamp?: string | null;
}



/**
 * Check if a given object implements the TaskStatus interface.
 */
export function instanceOfTaskStatus(value: object): value is TaskStatus {
    if (!('state' in value) || value['state'] === undefined) return false;
    return true;
}

export function TaskStatusFromJSON(json: any): TaskStatus {
    return TaskStatusFromJSONTyped(json, false);
}

export function TaskStatusFromJSONTyped(json: any, ignoreDiscriminator: boolean): TaskStatus {
    if (json == null) {
        return json;
    }
    return {
        
        'message': json['message'] == null ? undefined : MessageFromJSON(json['message']),
        'state': TaskStateFromJSON(json['state']),
        'timestamp': json['timestamp'] == null ? undefined : json['timestamp'],
    };
}

export function TaskStatusToJSON(json: any): TaskStatus {
    return TaskStatusToJSONTyped(json, false);
}

export function TaskStatusToJSONTyped(value?: TaskStatus | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'message': MessageToJSON(value['message']),
        'state': TaskStateToJSON(value['state']),
        'timestamp': value['timestamp'],
    };
}

