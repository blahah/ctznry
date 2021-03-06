/* globals beaker monaco */
import { LitElement, html } from '../../vendor/lit-element/lit-element.js'
import * as toast from './toast.js'
import * as session from '../lib/session.js'
import css from '../../css/com/composer.css.js'

const CHAR_LIMIT = 256

class Composer extends LitElement {
  static get properties () {
    return {
      placeholder: {type: String},
      draftText: {type: String, attribute: 'draft-text'},
      subject: {type: Object},
      parent: {type: Object},
      _visibility: {type: String}
    }
  }

  constructor () {
    super()
    this.placeholder = 'What\'s new?'
    this.draftText = ''
    this.subject = undefined
    this.parent = undefined
  }

  static get styles () {
    return css
  }

  get canPost () {
    return this.draftText.length > 0 && this.draftText.length <= CHAR_LIMIT
  }

  firstUpdated () {
    this.shadowRoot.querySelector('textarea').focus()
  }

  get charLimitDanger () {
    if (this.draftText.length > CHAR_LIMIT) {
      return 'over'
    }
    if (this.draftText.length > CHAR_LIMIT - 50) {
      return 'close'
    }
    return 'fine'
  }

  // rendering
  // =

  render () {
    return html`
      <link rel="stylesheet" href=${(new URL('../../css/fontawesome.css', import.meta.url)).toString()}>
      <link rel="stylesheet" href=${(new URL('../vs/editor/editor.main.css', import.meta.url)).toString()}>
      <form @submit=${this.onSubmit}>
        <div class="editor">
          <textarea placeholder=${this.placeholder} @keyup=${this.onTextareaKeyup}></textarea>
        </div>

        <div class="actions">
          <div class="ctrls">
            <span class="char-limit ${this.charLimitDanger}">
              ${this.draftText.length} / ${CHAR_LIMIT}
            </span>
          </div>
          <div>
            <button @click=${this.onCancel} tabindex="4">Cancel</button>
            <button type="submit" class="primary" tabindex="3" ?disabled=${!this.canPost}>
              Post
            </button>
          </div>
        </div>
      </form>
    `
  }
  
  // events
  // =

  onTextareaKeyup (e) {
    this.draftText = e.currentTarget.value
  }

  onCancel (e) {
    e.preventDefault()
    e.stopPropagation()
    this.draftText = ''
    this.dispatchEvent(new CustomEvent('cancel'))
  }

  async onSubmit (e) {
    e.preventDefault()
    e.stopPropagation()

    if (!this.canPost) {
      return
    }

    let res
    try {
      if (this.subject || this.parent) {
        res = await session.api.comments.create({
          subject: this.subject,
          parentComment: this.parent && this.parent.dbUrl !== this.subject.dbUrl ? this.parent : undefined,
          text: this.draftText
        })
      } else {
        res = await session.api.posts.create({text: this.draftText})
      }
    } catch (e) {
      toast.create(e.message, 'error')
      return
    }
    
    this.draftText = ''
    this.dispatchEvent(new CustomEvent('publish', {detail: res}))
  }
}

customElements.define('ctzn-composer', Composer)
