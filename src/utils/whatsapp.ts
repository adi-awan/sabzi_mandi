/**
 * WhatsApp Message Generator
 * Creates dynamic wa.me links with encoded order details
 * 
 * Usage:
 *   const link = generateWhatsAppOrderLink(order, ownerNumber)
 *   // Returns: https://wa.me/923001234567?text=...encoded_message...
 */

export interface WhatsAppOrderData {
  orderId: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    price: number
  }>
  totalAmount: number
  deliveryCharges: number
  paymentMethod: string
  screenshotUrl?: string
}

/**
 * Generate WhatsApp message link for order notification
 * Sends to store owner with complete order details
 */
export function generateWhatsAppOrderLink(
  order: WhatsAppOrderData,
  ownerNumber: string = '923001234567'
): string {
  // Clean the phone number (remove + and spaces)
  const cleanNumber = ownerNumber.replace(/[^0-9]/g, '')

  // Build the message
  const itemsList = order.items
    .map((item, i) => `${i + 1}. ${item.name} - ${item.quantity} ${item.unit} = Rs. ${(item.price * item.quantity).toLocaleString()}`)
    .join('\n')

  const message = `*NEW ORDER - Sabzi Mandi* 🥬

*Order ID:* #${order.orderId}
*Date:* ${new Date().toLocaleDateString('en-PK')}

*Customer Details:*
Name: ${order.customerName}
Phone: ${order.customerPhone}
City: ${order.deliveryCity}
Address: ${order.deliveryAddress}

*Order Items:*
${itemsList}

*Subtotal:* Rs. ${(order.totalAmount - order.deliveryCharges).toLocaleString()}
*Delivery:* ${order.deliveryCharges === 0 ? 'FREE' : 'Rs. ' + order.deliveryCharges.toLocaleString()}
*Total Amount:* Rs. ${order.totalAmount.toLocaleString()}

*Payment:* ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Easypaisa'}${
    order.screenshotUrl ? `\n*Payment Screenshot:* ${order.screenshotUrl}` : ''
  }

---
_Sent from Sabzi Mandi Online Store_`

  // URL encode the message
  const encodedMessage = encodeURIComponent(message)
  
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}

/**
 * Generate WhatsApp message link for customer order confirmation
 */
export function generateCustomerWhatsAppLink(
  customerPhone: string,
  orderId: string,
  totalAmount: number,
  estimatedDelivery: string
): string {
  const cleanNumber = customerPhone.replace(/[^0-9]/g, '')
  // Add country code if not present
  const fullNumber = cleanNumber.startsWith('92') ? cleanNumber : '92' + cleanNumber.substring(1)

  const message = `Assalam o Alaikum! 🌿

Thank you for your order from *Sabzi Mandi*!

*Order ID:* #${orderId}
*Total:* Rs. ${totalAmount.toLocaleString()}
*Estimated Delivery:* ${estimatedDelivery}

We will notify you when your order is out for delivery. 

For any queries, contact us at:
📞 +92 300 1234567

_Sabzi Mandi - Taza Sabziyaan Seedhi Aapke Ghar!_ 🥬`

  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
}

/**
 * Generate admin WhatsApp notification message (plain text for API use)
 */
export function generateWhatsAppMessage(order: WhatsAppOrderData): string {
  const itemsList = order.items
    .map((item, i) => `${i + 1}. ${item.name} - ${item.quantity} ${item.unit} = Rs. ${(item.price * item.quantity).toLocaleString()}`)
    .join('\n')

  return `NEW ORDER - Sabzi Mandi 🥬

Order ID: #${order.orderId}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
City: ${order.deliveryCity}
Address: ${order.deliveryAddress}

Items:
${itemsList}

Total: Rs. ${order.totalAmount.toLocaleString()}
Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Easypaisa'}${
    order.screenshotUrl ? `\nScreenshot: ${order.screenshotUrl}` : ''
  }`
}
