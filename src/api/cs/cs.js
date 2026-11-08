import service from '@/utils/request'

// ============ 会话 ============
export const getSessionList = (params) => service({ url: '/cs/session/list', method: 'get', params })

// ============ 工单 ============
export const getTicketList = (params) => service({ url: '/cs/ticket/list', method: 'get', params })
export const updateTicket = (data) => service({ url: '/cs/ticket', method: 'put', data })

// ============ FAQ 分类 ============
export const getFaqCategoryList = (params) => service({ url: '/cs/faqCategory/list', method: 'get', params })
export const createFaqCategory = (data) => service({ url: '/cs/faqCategory', method: 'post', data })
export const updateFaqCategory = (data) => service({ url: '/cs/faqCategory', method: 'put', data })
export const deleteFaqCategory = (id) => service({ url: `/cs/faqCategory/${id}`, method: 'delete' })

// ============ FAQ ============
export const getFaqList = (params) => service({ url: '/cs/faq/list', method: 'get', params })
export const createFaq = (data) => service({ url: '/cs/faq', method: 'post', data })
export const updateFaq = (data) => service({ url: '/cs/faq', method: 'put', data })
export const deleteFaq = (id) => service({ url: `/cs/faq/${id}`, method: 'delete' })

// ============ 消息通知 ============
export const getNotificationList = (params) => service({ url: '/cs/notification/list', method: 'get', params })
