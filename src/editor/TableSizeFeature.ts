import { createServerFeature } from '@payloadcms/richtext-lexical'

export const TableSizeFeature = createServerFeature({
  key: 'tableSize',
  dependencies: ['experimental_table'],
  feature: {
    ClientFeature: '/src/editor/TableSizeFeature.client#TableSizeFeatureClient',
  },
})
