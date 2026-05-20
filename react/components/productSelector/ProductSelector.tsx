/* eslint-disable jsx-a11y/no-static-element-interactions */
import type { MouseEvent } from 'react'
import React, { useState, useEffect, useMemo } from 'react'
import {
  pathOr,
  find,
  propEq,
  allPass,
  isEmpty,
  flatten,
} from 'ramda'
import { Checkbox, withToast } from 'vtex.styleguide'
import { useCssHandles } from 'vtex.css-handles'
import { useProductSummary } from 'vtex.product-summary-context/ProductSummaryContext'
import type { InjectedIntlProps } from 'react-intl'
import { injectIntl, defineMessages } from 'react-intl'
import { useProduct } from 'vtex.product-context'
import { useRuntime } from 'vtex.render-runtime'

import ComparisonContext from '../../ProductComparisonContext'

const CSS_HANDLES = ['productSelectorContainer', 'productSelectorChecked']

const messages = defineMessages({
  product: {
    defaultMessage: '',
    id: 'store/product-comparison.product-selector.product',
  },
  added: {
    defaultMessage: '',
    id: 'store/product-comparison.product-selector.product-added',
  },
  removed: {
    defaultMessage: '',
    id: 'store/product-comparison.product-selector.product-removed',
  },
  compare: {
    defaultMessage: '',
    id: 'store/product-comparison.product-selector.compare',
  },
  comparisonUpperLimit: {
    defaultMessage: '',
    id: 'store/product-comparison.product-selector.upper-limit-exceeded',
  },
})

interface Props extends InjectedIntlProps {
  showToast?: (input: ToastInput) => void
}

const getContextValue = (
  productContext: unknown,
  productSummaryContext: unknown
) => {
  const contextValue =
    productSummaryContext !== undefined ? productSummaryContext : productContext

  const productId = pathOr('', ['product', 'productId'], contextValue)
  const productName = pathOr('', ['product', 'productName'], contextValue)
  const itemId = pathOr('', ['selectedItem', 'itemId'], contextValue)
  const categoryId = pathOr('', ['product', 'categoryId'], contextValue)
  const categoriesIds = pathOr<string[]>(
    [],
    ['product', 'categoriesIds'],
    contextValue
  )

  const categories = pathOr<string[]>(
    [],
    ['product', 'categories'],
    contextValue
  )

  const productClusters = pathOr<Array<{ id?: string }>>(
    [],
    ['product', 'productClusters'],
    contextValue
  )

  const clusterHighlights = pathOr<Array<{ id?: string }>>(
    [],
    ['product', 'clusterHighlights'],
    contextValue
  )

  return {
    productName,
    productId,
    itemId,
    categoryId,
    categoriesIds,
    categories,
    productClusters,
    clusterHighlights,
  }
}

const extractCategoryIdsFromTree = (categories: string[]): string[] => {
  // Categories from product-summary-context come as "/Category/Sub/" path strings.
  // categoriesIds (when available) is the source of truth — these are just fallbacks.
  return flatten(categories.map((path) => path.split('/').filter(Boolean)))
}

const normalizePath = (raw: string): string => {
  if (!raw) return ''
  // strip protocol+host if user pasted a full URL
  let value = raw.trim()

  value = value.replace(/^https?:\/\/[^/]+/i, '')
  // strip querystring/hash
  value = value.split('?')[0].split('#')[0]
  // ensure leading slash
  if (value && !value.startsWith('/')) value = `/${value}`
  // strip trailing slash except root
  if (value.length > 1) value = value.replace(/\/+$/, '')

  return value.toLowerCase()
}

const urlMatches = (current: string, patterns: string[]): boolean => {
  const path = normalizePath(current)

  if (!path) return false

  return patterns.some((raw) => {
    const pattern = normalizePath(raw.replace(/\*$/, '*'))

    if (!pattern) return false

    // Wildcard suffix: "/sabanas/*" matches "/sabanas" and "/sabanas/algo"
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2)

      return path === prefix || path.startsWith(`${prefix}/`)
    }

    // Exact match OR followed by "/" (avoid /sabanas matching /sabanas-2)
    return path === pattern || path.startsWith(`${pattern}/`)
  })
}

const useCurrentPath = (runtime: unknown): string => {
  // Prefer window.location.pathname — it's the actual visible URL.
  // Fall back to runtime.route.canonicalPath / path for SSR.
  if (typeof window !== 'undefined' && window.location) {
    return window.location.pathname || ''
  }

  return (
    pathOr('', ['route', 'canonicalPath'], runtime) ||
    pathOr('', ['route', 'path'], runtime)
  )
}

const ProductSelector = ({ showToast, intl }: Props) => {
  const cssHandles = useCssHandles(CSS_HANDLES)
  const [isChecked, setIsChecked] = useState(false)
  const valuesFromContext = useProductSummary()
  const valuesFromProductContext = useProduct()
  const {
    productId,
    productName,
    itemId,
    categoryId,
    categoriesIds,
    categories,
    productClusters,
    clusterHighlights,
  } = getContextValue(valuesFromProductContext, valuesFromContext)

  const runtime = useRuntime()
  const currentPath = useCurrentPath(runtime)

  const {
    useProductComparisonState,
    useProductComparisonDispatch,
  } = ComparisonContext

  const comparisonData = useProductComparisonState()
  const dispatchComparison = useProductComparisonDispatch()

  const enabled = pathOr(false, ['enabled'], comparisonData)
  const enabledCategories = pathOr<string[]>(
    [],
    ['enabledCategories'],
    comparisonData
  )

  const enabledCollections = pathOr<string[]>(
    [],
    ['enabledCollections'],
    comparisonData
  )

  const enabledUrls = pathOr<string[]>([], ['enabledUrls'], comparisonData)

  const isDrawerCollapsed = pathOr(false, ['isDrawerCollapsed'], comparisonData)
  const productsSelected = pathOr([], ['products'], comparisonData)
  const maxItemsToCompare = pathOr(
    0,
    ['maxNumberOfItemsToCompare'],
    comparisonData
  )

  const isScopeAllowed = useMemo(() => {
    if (!enabled) return false

    const hasAnyScope =
      enabledCategories.length > 0 ||
      enabledCollections.length > 0 ||
      enabledUrls.length > 0

    if (!hasAnyScope) return false

    // 1) Category match
    if (enabledCategories.length > 0) {
      const productCategories: string[] = [
        ...(categoryId ? [String(categoryId)] : []),
        ...(Array.isArray(categoriesIds) ? categoriesIds.map(String) : []),
        ...extractCategoryIdsFromTree(categories || []),
      ]

      const allowedCategories = enabledCategories.map(String)

      if (productCategories.some((id) => allowedCategories.includes(id))) {
        return true
      }
    }

    // 2) Collection (productClusters) match
    if (enabledCollections.length > 0) {
      const productCollectionIds: string[] = [
        ...productClusters.map((c) => String(c?.id || '')),
        ...clusterHighlights.map((c) => String(c?.id || '')),
      ].filter(Boolean)

      const allowedCollections = enabledCollections.map(String)

      if (
        productCollectionIds.some((id) => allowedCollections.includes(id))
      ) {
        return true
      }
    }

    // 3) URL pattern match (on current page path)
    if (enabledUrls.length > 0 && urlMatches(currentPath, enabledUrls)) {
      return true
    }

    return false
  }, [
    enabled,
    enabledCategories,
    enabledCollections,
    enabledUrls,
    categoryId,
    categoriesIds,
    categories,
    productClusters,
    clusterHighlights,
    currentPath,
  ])

  useEffect(() => {
    const selectedProducts =
      productId && itemId
        ? find(
            allPass([propEq('productId', productId), propEq('skuId', itemId)])
          )(productsSelected)
        : []

    setIsChecked(selectedProducts && !isEmpty(selectedProducts))
  }, [productsSelected, itemId, productId])

  if (!isScopeAllowed) {
    return null
  }

  const showMessage = (message: string, show = true) => {
    if (showToast && show) {
      showToast({
        message,
      })
    }
  }

  const toggleComparison = () => {
    const willBeChecked = !isChecked

    if (willBeChecked && productsSelected.length === maxItemsToCompare) {
      showMessage(`${intl.formatMessage(messages.comparisonUpperLimit)}`, true)

      return
    }

    if (willBeChecked) {
      dispatchComparison({
        args: {
          product: { productId, skuId: itemId },
        },
        type: 'ADD',
      })
      showMessage(
        `${intl.formatMessage(
          messages.product
        )} "${productName}" ${intl.formatMessage(messages.added)}`,
        isDrawerCollapsed
      )
    } else {
      dispatchComparison({
        args: {
          product: { productId, skuId: itemId },
        },
        type: 'REMOVE',
      })
      showMessage(
        `${intl.formatMessage(
          messages.product
        )} "${productName}" ${intl.formatMessage(messages.removed)}`,
        isDrawerCollapsed
      )
    }
  }

  // Todo el contenedor (checkbox + label "Comparar") es clickeable.
  // preventDefault evita que el <label for> reenvíe el click al input
  // (doble toggle) y que el <a> del card navegue; stopPropagation corta el
  // burbujeo. El estado checked se sincroniza vía el useEffect desde el store.
  const productSelectionOnClicked = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleComparison()
  }

  return (
    <div
      onClick={productSelectionOnClicked}
      className={`${cssHandles.productSelectorContainer} ${
        isChecked ? cssHandles.productSelectorChecked : ''
      } mb3`}
    >
      <Checkbox
        checked={isChecked}
        id={`${productId}-${itemId}-product-comparison`}
        label={intl.formatMessage(messages.compare)}
        name={`${productId}-${itemId}-product-comparison`}
        onChange={() => {}}
        value={isChecked}
      />
    </div>
  )
}

export default withToast(injectIntl(ProductSelector))
