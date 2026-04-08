import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AtpAgent } from '@atproto/api';
import { publishIIIFRecord, IIIFRecordPayload } from '../src/atproto/publishRecord.js';

describe('publishIIIFRecord', () => {
  let mockAgent: any;

  beforeEach(() => {
    mockAgent = {
      session: {
        did: 'did:plc:12345'
      },
      com: {
        atproto: {
          repo: {
            createRecord: jest.fn().mockResolvedValue({
              data: {
                uri: 'at://did:plc:12345/cx.vmx.matadisco/abc',
                cid: 'bafy-record-cid'
              }
            })
          }
        }
      }
    };
  });

  it('transforms payload correctly into Matadisco lexicon', async () => {
    const payload: IIIFRecordPayload = {
      id: 'https://example.org/manifest',
      label: 'Test Manifest',
      summary: 'A summary',
      tags: ['art'],
      cid: 'bafy-manifest-cid'
    };

    const result = await publishIIIFRecord(mockAgent as unknown as AtpAgent, payload);

    expect(mockAgent.com.atproto.repo.createRecord).toHaveBeenCalled();
    const callArgs = mockAgent.com.atproto.repo.createRecord.mock.calls[0][0];

    expect(callArgs.collection).toBe('cx.vmx.matadisco');
    expect(callArgs.record.$type).toBe('cx.vmx.matadisco');
    expect(callArgs.record.resource).toBe(payload.id);
    expect(callArgs.record.cid).toBe(payload.cid);
    expect(callArgs.record.tags).toContain('iiif');
    expect(callArgs.record.tags).toContain('art');
    
    // Check nested iiif extension
    expect(callArgs.record.iiif.$type).toBe('io.iiif.metadata');
    expect(callArgs.record.iiif.label).toBe(payload.label);
    expect(callArgs.record.iiif.summary).toBe(payload.summary);

    expect(result.uri).toBe('at://did:plc:12345/cx.vmx.matadisco/abc');
    expect(result.cid).toBe('bafy-record-cid');
  });

  it('throws an error if agent session is missing', async () => {
    mockAgent.session = null;
    const payload: IIIFRecordPayload = { id: 'test' };

    await expect(publishIIIFRecord(mockAgent as unknown as AtpAgent, payload))
      .rejects.toThrow('AT Protocol Agent lacks an active session DID');
  });

  it('handles duplicate tags and ensures iiif is present', async () => {
    const payload: IIIFRecordPayload = {
      id: 'test',
      tags: ['iiif', 'photography', 'photography']
    };

    await publishIIIFRecord(mockAgent as unknown as AtpAgent, payload);

    const callArgs = mockAgent.com.atproto.repo.createRecord.mock.calls[0][0];
    const tags = callArgs.record.tags;
    
    expect(tags).toEqual(['iiif', 'photography']);
    expect(tags.filter((t: string) => t === 'iiif').length).toBe(1);
  });

  it('conditionally adds preview block if thumbnail is provided', async () => {
    const payload: IIIFRecordPayload = {
      id: 'test',
      thumbnail: 'https://example.org/thumb.jpg'
    };

    await publishIIIFRecord(mockAgent as unknown as AtpAgent, payload);

    const callArgs = mockAgent.com.atproto.repo.createRecord.mock.calls[0][0];
    expect(callArgs.record.preview).toBeDefined();
    expect(callArgs.record.preview.url).toBe(payload.thumbnail);
    expect(callArgs.record.preview.mimeType).toBe('image/jpeg');
  });

  it('does not add preview block if thumbnail is missing', async () => {
    const payload: IIIFRecordPayload = { id: 'test' };

    await publishIIIFRecord(mockAgent as unknown as AtpAgent, payload);

    const callArgs = mockAgent.com.atproto.repo.createRecord.mock.calls[0][0];
    expect(callArgs.record.preview).toBeUndefined();
  });
});
