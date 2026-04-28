import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';

const _mainSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('io.iiif.metadata')),
  /**
   * The title or name of the resource.
   */
  label: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  /**
   * A dictionary of flattened IIIF key-value metadata pairs.
   */
  metadata: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
  /**
   * The publishing institution or provider.
   */
  provider: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  /**
   * The license or rights URI (e.g., Creative Commons).
   */
  rights: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  /**
   * A short descriptive text.
   */
  summary: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  /**
   * The IIIF resource type (e.g., Manifest, Collection).
   */
  type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
});

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}
