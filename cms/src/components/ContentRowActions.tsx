'use client'

import { useId } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { DefaultCellComponentProps } from 'payload'
import { ConfirmationModal, RenderDefaultCell, toast, useAuth, useConfig, useListDrawerContext, useListQuery, useModal } from '@payloadcms/ui'
import './content-row-actions.css'

type Props = Pick<DefaultCellComponentProps, 'collectionSlug' | 'rowData' | 'link' | 'linkURL' | 'columnIndex'> & {
  title: string
  publishedPath?: string
}

export function ContentRowActions({ collectionSlug, rowData, title, publishedPath, link, linkURL, columnIndex }: Props) {
  const { permissions } = useAuth()
  const { config } = useConfig()
  const { isInDrawer } = useListDrawerContext()
  const { data, query, refineListData } = useListQuery()
  const { openModal } = useModal()
  const router = useRouter()
  const uniqueID = useId()
  const modalSlug = `content-delete-${collectionSlug}-${rowData.id}-${uniqueID}`
  const editURL = `${config.routes.admin}/collections/${collectionSlug}/${encodeURIComponent(String(rowData.id))}`
  const canDelete = permissions?.collections?.[collectionSlug]?.delete === true

  async function deleteRecord() {
    try {
      const response = await fetch(`${config.routes.api}/${collectionSlug}/${encodeURIComponent(String(rowData.id))}`, {
        method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json' },
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.errors?.map((error: { message?: string }) => error.message).filter(Boolean).join(' ') || 'Unable to delete this content. Please try again.')
        return
      }
      toast.success(`Deleted “${title}”.`)
      if (data?.docs.length === 1 && Number(query?.page) > 1) await refineListData({ page: Number(query.page) - 1 })
      else router.refresh()
    } catch {
      toast.error('Unable to confirm deletion. Refresh the list before trying again.')
    }
  }

  return <div className="content-title-cell">
    <RenderDefaultCell clientProps={{ collectionSlug, rowData, cellData: title, field: { name: 'title', type: 'text' }, link, linkURL }}
      columnIndex={columnIndex || 0} isLinkedColumn={Boolean(link)} />
    {!isInDrawer && <>
      <div className="content-row-actions" role="group" aria-label={`Actions for ${title}`}>
        {publishedPath
          ? <a href={publishedPath} target="_blank" rel="noopener noreferrer" title="Open the published website page">View</a>
          : <span aria-disabled="true" title="Publish this content to view it on the website. Use Preview to review the saved draft.">View</span>}
        <a href={`/preview?collection=${collectionSlug}&id=${encodeURIComponent(String(rowData.id))}`} target="_blank" rel="noopener noreferrer" title="Open the saved draft">Preview</a>
        <Link href={editURL} prefetch={false}>Edit</Link>
        {canDelete && <button type="button" className="content-row-actions__delete" onClick={() => openModal(modalSlug)}>Delete</button>}
      </div>
      {canDelete && <ConfirmationModal modalSlug={modalSlug} heading="Delete this content?"
        body={<p>Permanently delete <strong>{title}</strong>? This cannot be undone. Published content that is still required by another page cannot be deleted.</p>}
        confirmLabel="Delete" confirmingLabel="Deleting…" onConfirm={deleteRecord} />}
    </>}
  </div>
}
