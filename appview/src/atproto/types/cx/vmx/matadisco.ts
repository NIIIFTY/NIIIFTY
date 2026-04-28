import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as IoIiifMetadata from '../../io/iiif/metadata.js';

const _mainSchema = /*#__PURE__*/ v.record(
  /*#__PURE__*/ v.tidString(),
  /*#__PURE__*/ v.object({
    $type: /*#__PURE__*/ v.literal('cx.vmx.matadisco'),
    /**
     * Optional immutable CID for IPFS verifiability.
     */
    cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
    get iiif() {
      return /*#__PURE__*/ v.optional(IoIiifMetadata.mainSchema);
    },
    /**
     * Optional thumbnail preview object.
     */
    preview: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
    publishedAt: /*#__PURE__*/ v.datetimeString(),
    /**
     * The stable IPNS URL resolving to the manifest (IIIF id).
     */
    resource: /*#__PURE__*/ v.string(),
    /**
     * @maxLength 10
     */
    tags: /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.array(/*#__PURE__*/ v.string()), [/*#__PURE__*/ v.arrayLength(0, 10)]),
    ),
  }),
);

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}

declare module '@atcute/lexicons/ambient' {
  interface Records {
    'cx.vmx.matadisco': mainSchema;
  }
}
