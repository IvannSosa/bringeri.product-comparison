import React from 'react'
import { pathOr, find, propEq, findLast } from 'ramda'
import { useCssHandles } from 'vtex.css-handles'

import ComparisonProductContext from '../../ComparisonProductContext'
import './row.css'

const CSS_HANDLES = [
  'productFieldValue',
  'skuFieldValue',
  'productSpecificationValues',
  'productSpecificationValue',
  'skuSpecificationValues',
  'skuSpecificationValue',
]

interface Props {
  productToCompare: ProductToCompare
  field: ComparisonField
}

// Algunas specs del catálogo guardan HTML (br, ul, li, strong) — renderizamos
// como markup en lugar de texto escapado. Heurística: presencia de un tag.
const HTML_TAG_REGEX = /<[a-z][\s\S]*?>/i

const renderSpecValue = (value: string, className: string, key: string) => {
  if (typeof value === 'string' && HTML_TAG_REGEX.test(value)) {
    return (
      <span
        className={className}
        key={key}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  return (
    <span className={className} key={key}>
      {value}
    </span>
  )
}
const ComparisonFieldValue = ({ field, productToCompare }: Props) => {
  const cssHandles = useCssHandles(CSS_HANDLES)
  const { useComparisonProductState } = ComparisonProductContext
  const productData = useComparisonProductState()

  const products = pathOr([] as ProductToCompare[], ['products'], productData)
  const selectedProduct = find(propEq('productId', productToCompare.productId))(
    products
  )

  const selectedSku = find(propEq('itemId', productToCompare.skuId))(
    pathOr([], ['items'], selectedProduct)
  )

  if (field.fieldType === 'ProductField') {
    return (
      <span className={cssHandles.productFieldValue}>
        {pathOr('', [field.name], selectedProduct)}
      </span>
    )
  }

  if (field.fieldType === 'SkuField') {
    return (
      <span className={cssHandles.skuFieldValue}>
        {pathOr('', [field.name], selectedSku)}
      </span>
    )
  }

  if (field.fieldType === 'ProductSpecificationField') {
    const groups = pathOr([], ['specificationGroups'], selectedProduct)
    const allSpecifications = findLast(propEq('name', 'allSpecifications'))(
      groups
    )

    const specifications = pathOr([], ['specifications'], allSpecifications)

    const values = pathOr(
      [],
      ['values'],
      find(propEq('name', field.name))(specifications)
    )

    return (
      <div
        className={`${cssHandles.productSpecificationValues} flex flex-column`}
      >
        {values.map((value) =>
          renderSpecValue(
            value,
            cssHandles.productSpecificationValue,
            `${field.fieldType}-${field.name}-${value}`
          )
        )}
      </div>
    )
  }

  if (field.fieldType === 'SkuSpecificationField') {
    const skuSpecifications = pathOr([], ['variations'], selectedSku)
    const values = pathOr(
      [],
      ['values'],
      find(propEq('name', field.name))(skuSpecifications)
    )

    return (
      <div className={`${cssHandles.skuSpecificationValues} flex flex-column`}>
        {values.map((value) =>
          renderSpecValue(
            value,
            cssHandles.skuSpecificationValue,
            `${field.fieldType}-${field.name}-${value}`
          )
        )}
      </div>
    )
  }

  if (field.fieldType === 'GroupedSpecification') {
    const groups = pathOr([], ['specificationGroups'], selectedProduct)
    const groupedSpecification = findLast(propEq('name', field.groupName))(
      groups
    )

    const specifications = pathOr([], ['specifications'], groupedSpecification)

    const values = pathOr(
      [],
      ['values'],
      find(propEq('name', field.name))(specifications)
    )

    return (
      <div
        className={`${cssHandles.productSpecificationValues} flex flex-column`}
      >
        {values.map((value) =>
          renderSpecValue(
            value,
            cssHandles.productSpecificationValue,
            `${field.fieldType}-${field.name}-${value}`
          )
        )}
      </div>
    )
  }

  return <div />
}

export default ComparisonFieldValue
