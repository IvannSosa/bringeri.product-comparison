import type { ReactChildren, ReactChild } from 'react'
import React, { useMemo } from 'react'
import { ToastProvider } from 'vtex.styleguide'

import ComparisonContext from './ProductComparisonContext'
import ComparisonProductWrapper from './ComparisonProductWrapper'

interface CategoryEntry {
  categoryId?: string
}

interface CollectionEntry {
  collectionId?: string
}

interface UrlEntry {
  url?: string
}

interface Props {
  children: ReactChildren | ReactChild
  maxNumberOfItemsToCompare?: number
  enabled?: boolean
  enabledCategories?: CategoryEntry[]
  enabledCollections?: CollectionEntry[]
  enabledUrls?: UrlEntry[]
}

function normalize<T>(
  entries: T[] | undefined,
  key: keyof T
): string[] {
  if (!entries || entries.length === 0) return []

  return entries
    .map((entry) => {
      const raw = entry ? entry[key] : undefined

      return raw ? String(raw).trim() : ''
    })
    .filter((value) => value.length > 0)
}

const ProductComparisonWrapper = ({
  children,
  enabled = false,
  enabledCategories,
  enabledCollections,
  enabledUrls,
}: Props) => {
  const { ProductComparisonProvider } = ComparisonContext

  const normalizedCategories = useMemo(
    () => normalize(enabledCategories, 'categoryId'),
    [enabledCategories]
  )

  const normalizedCollections = useMemo(
    () => normalize(enabledCollections, 'collectionId'),
    [enabledCollections]
  )

  const normalizedUrls = useMemo(
    () => normalize(enabledUrls, 'url'),
    [enabledUrls]
  )

  return (
    <ProductComparisonProvider
      enabled={enabled}
      enabledCategories={normalizedCategories}
      enabledCollections={normalizedCollections}
      enabledUrls={normalizedUrls}
    >
      <ComparisonProductWrapper>
        <ToastProvider positioning="window">{children}</ToastProvider>
      </ComparisonProductWrapper>
    </ProductComparisonProvider>
  )
}

ProductComparisonWrapper.schema = {
  title: 'admin/editor.comparison-context-wrapper.title',
  description: 'admin/editor.comparison-context-wrapper.description',
  type: 'object',
  properties: {
    enabled: {
      title: 'admin/editor.comparison-context-wrapper.enabled.title',
      description:
        'admin/editor.comparison-context-wrapper.enabled.description',
      type: 'boolean',
      default: false,
    },
    enabledCategories: {
      title:
        'admin/editor.comparison-context-wrapper.enabled-categories.title',
      description:
        'admin/editor.comparison-context-wrapper.enabled-categories.description',
      type: 'array',
      minItems: 0,
      items: {
        title:
          'admin/editor.comparison-context-wrapper.enabled-categories.item.title',
        type: 'object',
        properties: {
          categoryId: {
            title:
              'admin/editor.comparison-context-wrapper.enabled-categories.category-id.title',
            description:
              'admin/editor.comparison-context-wrapper.enabled-categories.category-id.description',
            type: 'string',
            default: '',
          },
        },
      },
    },
    enabledCollections: {
      title:
        'admin/editor.comparison-context-wrapper.enabled-collections.title',
      description:
        'admin/editor.comparison-context-wrapper.enabled-collections.description',
      type: 'array',
      minItems: 0,
      items: {
        title:
          'admin/editor.comparison-context-wrapper.enabled-collections.item.title',
        type: 'object',
        properties: {
          collectionId: {
            title:
              'admin/editor.comparison-context-wrapper.enabled-collections.collection-id.title',
            description:
              'admin/editor.comparison-context-wrapper.enabled-collections.collection-id.description',
            type: 'string',
            default: '',
          },
        },
      },
    },
    enabledUrls: {
      title: 'admin/editor.comparison-context-wrapper.enabled-urls.title',
      description:
        'admin/editor.comparison-context-wrapper.enabled-urls.description',
      type: 'array',
      minItems: 0,
      items: {
        title:
          'admin/editor.comparison-context-wrapper.enabled-urls.item.title',
        type: 'object',
        properties: {
          url: {
            title:
              'admin/editor.comparison-context-wrapper.enabled-urls.url.title',
            description:
              'admin/editor.comparison-context-wrapper.enabled-urls.url.description',
            type: 'string',
            default: '',
          },
        },
      },
    },
  },
}

export default ProductComparisonWrapper
