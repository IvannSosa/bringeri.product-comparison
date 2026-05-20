/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react'
import { pathOr, isEmpty } from 'ramda'
import { withToast } from 'vtex.styleguide'
import { ExtensionPoint, useRuntime } from 'vtex.render-runtime'
import { useCssHandles } from 'vtex.css-handles'
import type { InjectedIntlProps } from 'react-intl'
import { injectIntl, defineMessages } from 'react-intl'

import ComparisonContext from '../../ProductComparisonContext'
import './drawer.css'

const CSS_HANDLES = [
  'drawerContainer',
  'expandCollapseButton',
  'comparisonButtons',
  'compareProductsButton',
  'drawer',
  'compareProductButtonWrapper',
  'removeAllWrapper',
  'hideOrShowText',
  'drawerTitleOuterContainer',
  'drawerTitleInnerContainer',
  'drawerOpened',
  'drawerClosed',
  'drawerHeader',
  'drawerHeaderToggle',
  'drawerBody',
  'drawerActions',
  'drawerChevron',
  'drawerEmptySlot',
  'drawerEmptySlotText',
]

const messages = defineMessages({
  removeAll: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.remove-all',
  },
  products: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.products',
  },
  compare: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.compare',
  },
  title: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.title',
  },
  removeAllMessage: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.remove-all-message',
  },
  show: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.show',
  },
  hide: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.hide',
  },
  minItemsMessage: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.min-items-message',
  },
  maxItemsMessage1: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.max-items-message-1',
  },
  maxItemsMessage2: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.max-items-message-2',
  },
  emptySlot: {
    defaultMessage: '',
    id: 'store/product-comparison.drawer.empty-slot',
  },
})

// Cantidad de slots visibles en el drawer (Figma node 5947:171888 — mobile).
// Los slots no ocupados por un producto se renderizan como placeholders.
const DEFAULT_NUMBER_OF_SLOTS = 3

interface Props extends InjectedIntlProps {
  showToast?: (input: ToastInput) => void
  comparisonPageUrl?: string
  numberOfSlots?: number
}

const ComparisonDrawer = ({
  showToast,
  intl,
  comparisonPageUrl,
  numberOfSlots = DEFAULT_NUMBER_OF_SLOTS,
}: Props) => {
  const cssHandles = useCssHandles(CSS_HANDLES)
  const { navigate } = useRuntime()
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

  const hasAnyScope =
    enabledCategories.length > 0 ||
    enabledCollections.length > 0 ||
    enabledUrls.length > 0

  const comparisonProducts = pathOr(
    [] as ProductToCompare[],
    ['products'],
    comparisonData
  )

  const maxNumberOfItemsToCompare = pathOr(
    DEFAULT_NUMBER_OF_SLOTS,
    ['maxNumberOfItemsToCompare'],
    comparisonData
  )

  const isCollapsed = pathOr(false, ['isDrawerCollapsed'], comparisonData)

  const showMessage = (message: string) => {
    if (showToast) {
      showToast({
        message,
      })
    }
  }

  const removeAllItems = () => {
    dispatchComparison({
      type: 'REMOVE_ALL',
    })
    showMessage(intl.formatMessage(messages.removeAllMessage))
  }

  const onExpandCollapse = () => {
    dispatchComparison({
      args: {
        isDrawerCollapsed: !isCollapsed,
      },
      type: 'IS_DRAWER_COLLAPSED',
    })
  }

  const navigateToComparisonPage = () => {
    const url =
      comparisonProducts.length < 2
        ? '#'
        : comparisonPageUrl || '/product-comparison'

    navigate({ to: url })
  }

  const onClickCompare = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!comparisonProducts || comparisonProducts.length < 2) {
      showMessage(intl.formatMessage(messages.minItemsMessage))
      e.preventDefault()
      e.stopPropagation()

      return
    }

    if (comparisonProducts.length > maxNumberOfItemsToCompare) {
      showMessage(
        `${intl.formatMessage(
          messages.maxItemsMessage1
        )} ${maxNumberOfItemsToCompare} ${intl.formatMessage(
          messages.maxItemsMessage2
        )}`
      )
      e.preventDefault()
      e.stopPropagation()

      return
    }

    navigateToComparisonPage()
  }

  if (!enabled || !hasAnyScope) {
    return null
  }

  if (isEmpty(comparisonProducts)) {
    return null
  }

  const stateClass = isCollapsed ? cssHandles.drawerClosed : cssHandles.drawerOpened

  // Slots vacíos "Sin producto" — completan la grilla hasta numberOfSlots.
  // En desktop se ocultan vía CSS; en mobile se apilan debajo de los productos.
  const emptySlotsCount = Math.max(
    0,
    numberOfSlots - comparisonProducts.length
  )

  return (
    <div className={`${cssHandles.drawerContainer} ${stateClass}`}>
      <div
        className={`${cssHandles.drawerHeader} ${cssHandles.drawerTitleOuterContainer}`}
        onClick={onExpandCollapse}
        role="button"
        tabIndex={0}
      >
        <span className={cssHandles.drawerTitleInnerContainer}>
          {intl.formatMessage(messages.title)}
        </span>
        <button
          type="button"
          onClick={onExpandCollapse}
          className={`${cssHandles.drawerHeaderToggle} ${cssHandles.expandCollapseButton}`}
          aria-label={
            isCollapsed
              ? intl.formatMessage(messages.show)
              : intl.formatMessage(messages.hide)
          }
        >
          <span className={cssHandles.drawerChevron} aria-hidden="true" />
          <span className={cssHandles.hideOrShowText}>
            {isCollapsed
              ? intl.formatMessage(messages.show)
              : intl.formatMessage(messages.hide)}
          </span>
        </button>
      </div>

      <div
        className={cssHandles.drawerBody}
        aria-hidden={isCollapsed}
      >
        <div className={cssHandles.drawer}>
          {/*
           * `key` derivada del set de productos: fuerza el remount del slider
           * cuando cambia la comparación. vtex.slider-layout retiene slides
           * obsoletos al achicarse la lista (cards fantasma); un mount fresco
           * no puede arrastrar ese estado interno.
           */}
          <ExtensionPoint
            id="list-context.comparison-product-summary-slider"
            key={`comparison-drawer-slider-${comparisonProducts
              .map((product) => `${product.productId}-${product.skuId}`)
              .join('_')}`}
          />

          {Array.from({ length: emptySlotsCount }).map((_, index) => {
            // Posición global del slot en la grilla 3-up (después de los
            // productos seleccionados). El SCSS desktop la consume vía CSS
            // var para alinear el placeholder con la celda vacía del slider.
            const slotIndex = comparisonProducts.length + index

            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`comparison-drawer-empty-slot-${index}`}
                className={cssHandles.drawerEmptySlot}
                style={
                  { '--slot-index': slotIndex } as React.CSSProperties
                }
                aria-hidden="true"
              >
                <span className={cssHandles.drawerEmptySlotText}>
                  {intl.formatMessage(messages.emptySlot)}
                </span>
              </div>
            )
          })}
        </div>

        <div className={`${cssHandles.drawerActions} ${cssHandles.comparisonButtons}`}>
          <div
            className={cssHandles.compareProductButtonWrapper}
            onClick={onClickCompare}
            role="button"
            tabIndex={0}
          >
            <button
              type="button"
              className={cssHandles.compareProductsButton}
            >
              {intl.formatMessage(messages.compare)}
            </button>
          </div>
          <button
            type="button"
            onClick={removeAllItems}
            className={cssHandles.removeAllWrapper}
          >
            {intl.formatMessage(messages.removeAll)}
          </button>
        </div>
      </div>
    </div>
  )
}

ComparisonDrawer.schema = {
  title: 'admin/editor.comparison-drawer.title',
  description: 'admin/editor.comparison-drawer.description',
  type: 'object',
  properties: {
    comparisonPageUrl: {
      title: 'admin/editor.comparison-grid.drawer.title',
      type: 'string',
    },
    numberOfSlots: {
      title: 'admin/editor.comparison-drawer.number-of-slots.title',
      description:
        'admin/editor.comparison-drawer.number-of-slots.description',
      type: 'number',
      default: DEFAULT_NUMBER_OF_SLOTS,
    },
  },
}

export default withToast(injectIntl(ComparisonDrawer))
