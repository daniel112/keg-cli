const { isArr, eitherArr } = require('@keg-hub/jsutils')

/**
 * Loops over a collection of test items, and executes a test on them
 * @function
 * @param {Object|Array} testItems - Items that should be tested
 * @param {function} testAction - Function that is being tested
 *
 * @returns {void}
 */
const testEnum = (testItems, testAction, log) => {
  

  return Object.entries(testItems)
    .map(([name, data]) => {
      
      const testTitle = `${name} - ${data.description}`
      const testMethod = async () => {
        log
          ? console.log(await testAction(...(eitherArr(data.inputs, [data.inputs]))))
          : expect(
              await testAction(
                ...(eitherArr(data.inputs, [data.inputs]))
              )
            )[data.matcher || 'toEqual'](
              ...(eitherArr(data.outputs, [data.outputs]))
            )
      }
    
      data.only
        ? it.only(testTitle, testMethod)
        : it(testTitle, testMethod)

    })
}


module.exports = {
  testEnum
}