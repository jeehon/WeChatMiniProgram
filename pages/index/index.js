// index.js
const app = getApp()
const API_BASE_URL = 'https://knowledgecreationtime-eparhedpcbgyg8h3.eastasia-01.azurewebsites.net'

Page({
  data: {
    inputText: '',
    tempImagePath: '',
    generatedContent: '',
    isGenerating: false,
    isImageResult: false
  },

  onTextInput(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })
      
      this.setData({
        tempImagePath: res.tempFiles[0].tempFilePath,
        inputText: '' // 清空文字输入
      })
    } catch (error) {
      console.error('选择图片失败:', error)
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  },

  async generateContent() {
    if (!this.data.inputText && !this.data.tempImagePath) {
      wx.showToast({
        title: '请输入文字或上传图片',
        icon: 'none'
      })
      return
    }
    this.setData({ isGenerating: true, isImageResult: false })
    try {
      let result
      if (this.data.tempImagePath) {
        result = await this.processImage()
      } else {
        result = await this.processText();
      }
      this.setData({
        generatedContent: result,
        isGenerating: false
      })
    } catch (error) {
      console.error('生成文案失败:', error)
      wx.showToast({
        title: '生成文案失败，请重试',
        icon: 'none'
      })
      this.setData({ isGenerating: false })
    }
  },

  async processImage() {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${API_BASE_URL}/Upload`,
        filePath: this.data.tempImagePath,
        name: 'image',
        header: {
          'content-type': 'multipart/form-data'
        },
        success: async function(res) {
          // 调用生成文案API
          wx.request({
            url: `${API_BASE_URL}/KCTBackend`,
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            data: {
              type: 'ImageToText',
              content: res.data
            },
            success: function(res) {
              resolve(res.data.content)
            },
            fail: function(err) {
              reject(new Error('生成文案失败, ' + err))
            }
          })
        },
        fail: function(err) {
          reject(new Error('上传图片失败, ' + err))
        }
      })
    })
  },

  async processText() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE_URL}/KCTBackend`,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          type: 'Text',
          content: this.data.inputText
        },
        success: function(res) {
          resolve(res.data.content)
        },
        fail: function(err) {
          reject(new Error('生成文案失败, ' + err))
        }
      })
    })
  },

  copyContent() {
    if (this.data.isImageResult) {
      // 保存图片
      wx.saveImageToPhotosAlbum({
        filePath: this.data.generatedContent,
        success: () => {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
        },
        fail: () => {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      })
    } else {
      // 复制文案
      wx.setClipboardData({
        data: this.data.generatedContent,
        success: () => {
          wx.showToast({
            title: '复制成功',
            icon: 'success'
          })
        }
      })
    }
  },

  async generateImage() {
    if (!this.data.inputText && !this.data.tempImagePath) {
      wx.showToast({
        title: '请输入文字或上传图片',
        icon: 'none'
      })
      return
    }
    this.setData({ isGenerating: true, isImageResult: true })
    try {
      let result
      if (this.data.tempImagePath) {
        result = await this.processImageToImage()
      } else {
        result = await this.processTextToImage()
      }
      this.setData({
        generatedContent: result,
        isGenerating: false
      })
    } catch (error) {
      console.error('生成图片失败:', error)
      wx.showToast({
        title: '生成图片失败，请重试',
        icon: 'none'
      })
      this.setData({ isGenerating: false })
    }
  },

  async processImageToImage() {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${API_BASE_URL}/Upload`,
        filePath: this.data.tempImagePath,
        name: 'image',
        header: {
          'content-type': 'multipart/form-data'
        },
        success: async function(res) {
          wx.request({
            url: `${API_BASE_URL}/KCTBackend`,
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            data: {
              type: 'ImageToImage',
              content: res.data
            },
            success: function(res) {
              resolve(res.data.content)
            },
            fail: function(err) {
              reject(new Error('生成图片失败, ' + err))
            }
          })
        },
        fail: function(err) {
          reject(new Error('上传图片失败, ' + err))
        }
      })
    })
  },

  async processTextToImage() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE_URL}/KCTBackend`,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          type: 'TextToImage',
          content: this.data.inputText
        },
        success: function(res) {
          resolve(res.data.content)
        },
        fail: function(err) {
          reject(new Error('生成图片失败, ' + err))
        }
      })
    })
  }
})
