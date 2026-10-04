import { z } from 'zod';
import { db } from './server';

export const contentInput = z.object({
  id: z.string().uuid().optional(), kind: z.enum(['article','project']), title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(140).regex(/^[\p{L}\p{N}_-]+$/u), excerpt: z.string().max(1200).default(''),
  markdown: z.string().max(300000).default(''), cover: z.string().max(2000).default(''),
  tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  accent: z.enum(['blue','orange','yellow','lilac']).default('blue'),
  editorial: z.number().min(0).max(5).default(3), expectedRevision: z.number().int().min(1).optional(),
  github: z.string().max(2000).default(''), demo: z.string().max(2000).default(''),
  tech: z.array(z.string().max(40)).max(20).default([]), projectStatus: z.enum(['idea','building','live','paused']).default('building'),
  deploymentUuid: z.string().max(100).default(''), relatedIds: z.array(z.string().uuid()).max(30).default([]),
  series: z.string().max(80).default(''), demoContent: z.boolean().default(false),
});
export type Content = z.infer<typeof contentInput> & {
  id: string; revision: number; createdAt: string; updatedAt: string; status: 'draft'|'published'|'scheduled';
  isPublic: boolean; hasUnpublishedChanges: boolean; publicAt: string|null; trashedAt?: string|null;
};
type Row = { id:string; data_json:string; live_json:string|null; public_at:string|null; revision:number; updated_at:string; trashed_at:string|null };

export function rowContent(row: Row): Content {
  const data = JSON.parse(row.data_json);
  const isPublic = !!row.live_json && !!row.public_at && row.public_at <= new Date().toISOString() && !row.trashed_at;
  const live = row.live_json ? JSON.parse(row.live_json) : null;
  return { ...data, id:row.id, revision:row.revision, updatedAt:row.updated_at, isPublic,
    hasUnpublishedChanges: !!live && JSON.stringify(data) !== JSON.stringify(live),
    status: row.live_json ? isPublic ? 'published' : 'scheduled' : 'draft', publicAt:row.public_at, trashedAt:row.trashed_at };
}
export async function findContent(id:string) {
  const row = await db().prepare('SELECT * FROM contents WHERE id=?').bind(id).first<Row>();
  return row ? rowContent(row) : null;
}
export async function listContent(trashed=false) {
  const result = await db().prepare(`SELECT * FROM contents WHERE trashed_at IS ${trashed?'NOT ':''}NULL ORDER BY updated_at DESC`).all<Row>();
  return result.results.map(rowContent);
}
export async function saveContent(value:unknown) {
  const input = contentInput.parse(value), now = new Date().toISOString();
  const old = input.id ? await findContent(input.id) : null;
  if (input.id && !old) throw new Error('NOT_FOUND');
  if (old && old.revision !== input.expectedRevision) throw new Error('CONFLICT');
  const id = old?.id ?? crypto.randomUUID(), revision = (old?.revision ?? 0)+1;
  const { expectedRevision, ...fields } = input;
  const data = { ...fields, id, createdAt:old?.createdAt??now };
  const dataJson = JSON.stringify(data);
  const write = old
    ? db().prepare('UPDATE contents SET kind=?,slug=?,data_json=?,revision=?,updated_at=? WHERE id=? AND revision=? AND trashed_at IS NULL').bind(input.kind,input.slug,dataJson,revision,now,id,expectedRevision!)
    : db().prepare('INSERT INTO contents (id,kind,slug,data_json,revision,updated_at) VALUES (?,?,?,?,?,?)').bind(id,input.kind,input.slug,dataJson,revision,now);
  const results = await db().batch([write,
    db().prepare('INSERT OR IGNORE INTO revisions (id,content_id,revision,data_json,created_at) SELECT ?,id,revision,data_json,? FROM contents WHERE id=? AND revision=? AND data_json=?')
      .bind(`${id}:${revision}`,now,id,revision,dataJson)]);
  if (!results[0].meta.changes) throw new Error('CONFLICT');
  return (await findContent(id))!;
}

export async function publicContent() {
  const result = await db().prepare('SELECT live_json,public_at FROM contents WHERE live_json IS NOT NULL AND public_at<=? AND trashed_at IS NULL ORDER BY public_at DESC').bind(new Date().toISOString()).all<{live_json:string;public_at:string}>();
  return result.results.map(row => {
    const data=JSON.parse(row.live_json);
    const { deploymentUuid, expectedRevision, ...safe } = data;
    return { ...safe, status:'published', isPublic:true, publicAt:row.public_at };
  });
}
