export default function (source: string, strlist: string[], compilerNames: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function str2au(str: string | string[], compilerName?: string) {
    let strList: string[]
    if (typeof str === 'string')
      strList = [str]
    else
      strList = str

    if (compilerName)
      return `str2au(\`${str}\`,'${compilerName}')`

    const ss = compilerNames.map((e, i) => `str2au(\`${strList[i] || strList[0]}\`,'${e}')`).join(',')
    return `[${ss}]`
  }

  if (strlist) {
    for (const funStr of strlist) {
      // eslint-disable-next-line no-eval
      const resStr = eval(funStr) as string
      // console.log(resStr);
      source = source.replace(funStr, resStr)
    }
    return source
  }
  else {
    return source
  }
}
