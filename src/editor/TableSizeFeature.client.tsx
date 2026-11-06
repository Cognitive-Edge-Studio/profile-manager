'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $getSelection, $isRangeSelection, HISTORY_PUSH_TAG, type LexicalEditor } from '@payloadcms/richtext-lexical/lexical'
import { $computeTableMap, $getTableCellNodeFromLexicalNode, $getTableNodeFromLexicalNodeOrThrow, $isTableSelection } from '@lexical/table'

function $selectedCell() {
  const selection = $getSelection()
  return $isRangeSelection(selection) || $isTableSelection(selection)
    ? $getTableCellNodeFromLexicalNode(selection.anchor.getNode())
    : null
}

function resizeTable(editor: LexicalEditor, action: 'fit' | 'wider' | 'narrower') {
  editor.update(() => {
    const cell = $selectedCell()
    if (!cell) return
    const table = $getTableNodeFromLexicalNodeOrThrow(cell)
    const element = editor.getElementByKey(table.getKey())
    // Lexical can return either the table or its horizontal-scroll wrapper.
    const tableElement = element?.matches('table') ? element : element?.querySelector('table')
    if (!tableElement) return
    const count = table.getColumnCount()
    const columns = Array.from(tableElement.querySelectorAll<HTMLTableColElement>(':scope > colgroup > col'))
    // Use displayed widths: CSS expands legacy 92px columns to fill the editor.
    // Measuring avoids a jump on the first resize and preserves other columns.
    const widths = Array.from({ length: count }, (_, index) =>
      Math.round(columns[index]?.getBoundingClientRect().width || table.getColWidths()?.[index] || 160))

    if (action === 'fit') {
      const available = tableElement.parentElement?.clientWidth || editor.getRootElement()?.clientWidth || 640
      table.setColWidths(Array(count).fill(Math.max(160, Math.floor((available - 1) / count))))
    } else {
      // The table map accounts for merged cells and row spans.
      const [, cellMap] = $computeTableMap(table, cell, cell)
      const index = cellMap.startColumn
      widths[index] = Math.max(92, widths[index] + (action === 'wider' ? 48 : -48))
      table.setColWidths(widths)
    }
  }, { tag: HISTORY_PUSH_TAG })
}

export const TableSizeFeatureClient = createClientFeature({
  toolbarFixed: {
    groups: [{
      key: 'Table size',
      type: 'dropdown',
      order: 25,
      ChildComponent: () => <span className="cms-table-size-label">Table size</span>,
      isEnabled: () => Boolean($selectedCell()),
      items: [
        { key: 'fit-table', label: 'Fit table to editor', onSelect: ({ editor }) => resizeTable(editor, 'fit') },
        { key: 'widen-column', label: 'Widen selected column', onSelect: ({ editor }) => resizeTable(editor, 'wider') },
        { key: 'narrow-column', label: 'Narrow selected column', onSelect: ({ editor }) => resizeTable(editor, 'narrower') },
      ],
    }],
  },
})
