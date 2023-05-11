/**
 * Vendored from https://github.com/thawkin3/css-safe-classname
 * MIT licensed
 * https://github.com/thawkin3/css-safe-classname/blob/991003e9d2c29e1a3c6785bf9a057d78013cc2a6/LICENSE
 * @private
 */

const nonCssSafeCharacters = /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s]/

const invalidBeginningOfClassname = /^([0-9]|--|-[0-9])/

export const cssSafeName = str => {
  if (typeof str !== 'string') {
    return ''
  }

  const strippedClassname = str.replace(
    new RegExp(nonCssSafeCharacters, 'g'),
    ''
  )

  return invalidBeginningOfClassname.test(strippedClassname)
    ? `_${strippedClassname}`
    : strippedClassname
}