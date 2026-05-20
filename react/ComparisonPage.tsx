import type { ReactChild, ReactChildren } from 'react'
import React from 'react'
import { isEmpty, pathOr } from 'ramda'
import { useCssHandles } from 'vtex.css-handles'
import { Spinner, withToast } from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'
import type { InjectedIntlProps } from 'react-intl'
import { defineMessages, injectIntl } from 'react-intl'

import ComparisonContext from './ProductComparisonContext'
import './global.css'

const CSS_HANDLES = [
  'pageContainer',
  'pageHeader',
  'pageHeaderInner',
  'pageTitle',
  'backLink',
  'pageContent',
  'pageActions',
  'removeAllItemsButtonWrapper',
  'removeAllItemsButton',
  'sortBy',
]

interface Props extends InjectedIntlProps {
  children: ReactChildren | ReactChild
  showToast?: (input: ToastInput) => void
  backUrl?: string
}

const messages = defineMessages({
  removeAll: {
    defaultMessage: 'Borrar todo',
    id: 'store/product-comparison.drawer.remove-all',
  },
  removeAllMessage: {
    defaultMessage: 'Se removieron todos los productos de la comparación',
    id: 'store/product-comparison.drawer.remove-all-message',
  },
  backToProducts: {
    defaultMessage: 'Volver a la sábana de productos',
    id: 'store/product-comparison.main-page.back-to-products',
  },
  title: {
    defaultMessage: 'Encontrá tu mejor opción',
    id: 'store/product-comparison.main-page.title',
  },
})

const ComparisonPage = ({ children, intl, showToast, backUrl }: Props) => {
  const cssHandles = useCssHandles(CSS_HANDLES)
  const { navigate } = useRuntime()
  const {
    useProductComparisonState,
    useProductComparisonDispatch,
  } = ComparisonContext

  const comparisonData = useProductComparisonState()
  const dispatchComparison = useProductComparisonDispatch()

  const comparisonProducts = pathOr(
    [] as ProductToCompare[],
    ['products'],
    comparisonData
  )

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
    window.history.back()
  }

  const onBackButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (backUrl) {
      navigate({ to: backUrl })

      return
    }

    window.history.back()
  }

  if (isEmpty(comparisonProducts)) {
    return (
      <div className="mw3 center pa6">
        <Spinner />
      </div>
    )
  }

  return (
    <div className={cssHandles.pageContainer}>
      <div className={cssHandles.pageHeader}>
        <div className={cssHandles.pageHeaderInner}>
          <h1 className={cssHandles.pageTitle}>
            {intl.formatMessage(messages.title, {
              productsLength: comparisonProducts.length,
            })}
          </h1>
          <a
            href={backUrl || '#'}
            onClick={onBackButtonClick}
            className={cssHandles.backLink}
          >
            {intl.formatMessage(messages.backToProducts)}
          </a>
        </div>
      </div>

      <div className={cssHandles.pageContent}>{children}</div>

      <div className={cssHandles.pageActions}>
        <div className={cssHandles.removeAllItemsButtonWrapper}>
          <button
            type="button"
            className={cssHandles.removeAllItemsButton}
            onClick={removeAllItems}
          >
            {intl.formatMessage(messages.removeAll)}
          </button>
        </div>
      </div>
    </div>
  )
}

ComparisonPage.schema = {
  title: 'admin/editor.comparison-page.title',
  description: 'admin/editor.comparison-page.description',
  type: 'object',
  properties: {
    backUrl: {
      title: 'admin/editor.comparison-page.back-url.title',
      description: 'admin/editor.comparison-page.back-url.description',
      type: 'string',
      default: '',
    },
  },
}

export default withToast(injectIntl(ComparisonPage))
