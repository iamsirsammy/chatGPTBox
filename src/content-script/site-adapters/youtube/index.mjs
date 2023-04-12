import { cropText } from '../../../utils'
import { config } from '../index.mjs'

function replaceHtmlEntities(htmlString) { // This function was written by ChatGPT and modified by me (iamsirsammy)
  const doc = new DOMParser().parseFromString(htmlString.replace("&amp;", "&"), 'text/html');
  return doc.documentElement.innerText;
}

export default {
  init: async (hostname, userConfig, getInput, mountComponent) => {
    try {
      let oldUrl = location.href
      const checkUrlChange = async () => {
        if (location.href !== oldUrl) {
          oldUrl = location.href
          mountComponent(config.youtube, userConfig)
        }
      }
      window.setInterval(checkUrlChange, 500)
    } catch (e) {
      /* empty */
    }
  },
  inputQuery: async () => {
    try {
      const docText = await (
        await fetch(location.href, {
          credentials: 'include',
        })
      ).text()

      const subtitleUrlStartAt = docText.indexOf('https://www.youtube.com/api/timedtext')
      if (subtitleUrlStartAt === -1) return

      let subtitleUrl = docText.substring(subtitleUrlStartAt)
      subtitleUrl = subtitleUrl.substring(0, subtitleUrl.indexOf('"'))
      subtitleUrl = subtitleUrl.replaceAll('\\u0026', '&')

      let title = docText.substring(docText.indexOf('"title":"') + '"title":"'.length)
      title = title.substring(0, title.indexOf('","'))

      const subtitleResponse = await fetch(subtitleUrl)
      if (!subtitleResponse.ok) return
      let subtitleData = await subtitleResponse.text()

      let subtitleContent = ''
      while (subtitleData.indexOf('">') !== -1) {
        subtitleData = subtitleData.substring(subtitleData.indexOf('">') + 2)
        subtitleContent += subtitleData.substring(0, subtitleData.indexOf('<')) + ','
      }

      subtitleContent = replaceHtmlEntities(subtitleContent.replace(",", " "))

      return cropText(
        `Provide a brief summary of the following video using concise language, still including all the important details, and incorporating the video title.` +
          `The video title is "${title}". The subtitle content is as follows:\n${subtitleContent}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
