import { APIError, type Access, type CollectionBeforeChangeHook, type CollectionBeforeOperationHook, type GlobalBeforeChangeHook } from 'payload'
import { isAdmin, isEditor, publicationChangeAllowed } from './domain/contracts.mjs'

export const administrators: Access = ({ req }) => isAdmin(req.user)
export const editors: Access = ({ req }) => isEditor(req.user)
export const publishedOrEditor: Access = ({ req }) => isEditor(req.user) || { _status: { equals: 'published' } }
export const ownAccountOrAdmin: Access = ({ req }) => isAdmin(req.user) || (isEditor(req.user) ? { id: { equals: req.user!.id } } : false)
export const never: Access = () => false
export const contentWrite: Access = ({ req, data }) => isAdmin(req.user) || (isEditor(req.user) && data?._status !== 'published')
export const recordDraftOperation: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (args.req && ['create', 'update', 'restoreVersion'].includes(operation)) args.req.context.draftOperation = 'draft' in args && args.draft === true && (!('data' in args) || (args.data as Record<string, unknown>)?._status !== 'published')
  return args
}

export const protectPublishing: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  // Only local, explicitly privileged scripts may write without a logged-in actor.
  if (req.context.localBootstrap === true && !req.user) return data
  const draft = req.context.draftOperation === true
  if (!publicationChangeAllowed({ user: req.user, data, originalDoc, draft })) throw new APIError('Only an administrator can publish, unpublish, or directly change published content. Save your changes as a draft.', 403)
  if (!isAdmin(req.user)) data._status = 'draft'
  return data
}
export const protectSettings: GlobalBeforeChangeHook = ({ data, req }) => {
  if (!isAdmin(req.user) && req.context.localBootstrap !== true) throw new APIError('Only an administrator can change site settings.', 403)
  return data
}

export const contentAccess = {
  create: contentWrite,
  read: publishedOrEditor,
  update: contentWrite,
  delete: administrators,
  readVersions: editors,
}
