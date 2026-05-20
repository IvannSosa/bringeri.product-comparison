import React, { useEffect } from 'react'
import { pathOr, isEmpty } from 'ramda'
import { ExtensionPoint } from 'vtex.render-runtime'
import { useCssHandles } from 'vtex.css-handles'
import type { InjectedIntlProps } from 'react-intl'
import { injectIntl, defineMessages } from 'react-intl'

import './row.css'
import { usePixel } from 'vtex.pixel-manager'

import ComparisonContext from '../../ProductComparisonContext'

const CSS_HANDLES = ['productSummaryRowContainer', 'fieldNameCol']

const messages = defineMessages({
  specsColumnTitle: {
    defaultMessage: '',
    id: 'store/product-comparison.main-page.specs-column-title',
  },
})

const ProductSummaryRow = ({ intl }: InjectedIntlProps) => {
  const cssHandles = useCssHandles(CSS_HANDLES)

  const { useProductComparisonState } = ComparisonContext

  const comparisonData = useProductComparisonState()

  const comparisonProducts = pathOr(
    [] as ProductToCompare[],
    ['products'],
    comparisonData
  )

  const { push } = usePixel()

  const pixelEvent = (products: object, length: number) => {
    if (!!length && length >= 2) {
      push({
        event: 'productComparison',
        products,
        compareProductN: length,
      })
    }
  }

  useEffect(() => {
    pixelEvent(comparisonData.products, comparisonData.products.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return isEmpty(comparisonProducts) ? (
    <div />
  ) : (
    <div className={`${cssHandles.productSummaryRowContainer} flex flex-row`}>
      {/* Cabecera de la columna de labels — visible solo en mobile (CSS) */}
      <div className={cssHandles.fieldNameCol}>
        <span>{intl.formatMessage(messages.specsColumnTitle)}</span>
      </div>
      <ExtensionPoint id="list-context.comparison-product-summary-slider" />
    </div>
  )
}

ProductSummaryRow.schema = {
  title: 'editor.product-summary-row.title',
  description: 'editor.product-summary-row.description',
  type: 'object',
  properties: {},
}

export default injectIntl(ProductSummaryRow)
