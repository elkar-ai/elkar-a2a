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
import type { Part } from './Part';
import {
    PartFromJSON,
    PartFromJSONTyped,
    PartToJSON,
    PartToJSONTyped,
} from './Part';

/**
 * Artifact structure as per A2A specification
 * @export
 * @interface Artifact
 */
export interface Artifact {
    /**
     * 
     * @type {boolean}
     * @memberof Artifact
     */
    append?: boolean | null;
    /**
     * 
     * @type {string}
     * @memberof Artifact
     */
    description?: string | null;
    /**
     * 
     * @type {number}
     * @memberof Artifact
     */
    index: number;
    /**
     * 
     * @type {boolean}
     * @memberof Artifact
     */
    lastChunk?: boolean | null;
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof Artifact
     */
    metadata?: { [key: string]: any; };
    /**
     * 
     * @type {string}
     * @memberof Artifact
     */
    name?: string | null;
    /**
     * 
     * @type {Array<Part>}
     * @memberof Artifact
     */
    parts: Array<Part>;
}

/**
 * Check if a given object implements the Artifact interface.
 */
export function instanceOfArtifact(value: object): value is Artifact {
    if (!('index' in value) || value['index'] === undefined) return false;
    if (!('parts' in value) || value['parts'] === undefined) return false;
    return true;
}

export function ArtifactFromJSON(json: any): Artifact {
    return ArtifactFromJSONTyped(json, false);
}

export function ArtifactFromJSONTyped(json: any, ignoreDiscriminator: boolean): Artifact {
    if (json == null) {
        return json;
    }
    return {
        
        'append': json['append'] == null ? undefined : json['append'],
        'description': json['description'] == null ? undefined : json['description'],
        'index': json['index'],
        'lastChunk': json['last_chunk'] == null ? undefined : json['last_chunk'],
        'metadata': json['metadata'] == null ? undefined : json['metadata'],
        'name': json['name'] == null ? undefined : json['name'],
        'parts': ((json['parts'] as Array<any>).map(PartFromJSON)),
    };
}

export function ArtifactToJSON(json: any): Artifact {
    return ArtifactToJSONTyped(json, false);
}

export function ArtifactToJSONTyped(value?: Artifact | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'append': value['append'],
        'description': value['description'],
        'index': value['index'],
        'last_chunk': value['lastChunk'],
        'metadata': value['metadata'],
        'name': value['name'],
        'parts': ((value['parts'] as Array<any>).map(PartToJSON)),
    };
}

