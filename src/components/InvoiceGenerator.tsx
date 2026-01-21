import React, { useState } from 'react';
import jsPDF from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CyberButton } from '@/components/ui/CyberButton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Download, X } from 'lucide-react';
import { type Order } from '@/services/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InvoiceGeneratorProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ order, open, onOpenChange }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerZip, setCustomerZip] = useState('');
  const [customerCountry, setCustomerCountry] = useState('');
  const [shippingCharges, setShippingCharges] = useState<number>(0);

  React.useEffect(() => {
    if (order && open) {
      // Pre-fill customer details from shipping info
      setCustomerName(`${order.shipping_info.first_name} ${order.shipping_info.last_name}`);
      setCustomerEmail(order.shipping_info.email);
      setCustomerPhone(order.shipping_info.phone);
      setCustomerAddress(order.shipping_info.address);
      setCustomerCity(order.shipping_info.city);
      setCustomerState(order.shipping_info.state);
      setCustomerZip(order.shipping_info.zip_code);
      setCustomerCountry(order.shipping_info.country);
      setShippingCharges(order.shipping);
    }
  }, [order, open]);

  const generatePDF = () => {
    if (!order) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Gaming Theme Colors (RGB values for jsPDF)
    const neonCyan = [0, 255, 255];      // Electric Cyan
    const neonPurple = [180, 70, 255];   // Neon Purple
    const neonGreen = [0, 255, 0];       // RGB Green
    const darkBg = [13, 17, 23];         // Dark background
    const lightText = [240, 245, 250];   // Light text
    const mutedText = [160, 165, 170];   // Muted text

    // Draw dark background
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Top border with neon effect
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(2);
    doc.line(0, 0, pageWidth, 0);
    doc.setLineWidth(1);
    doc.setDrawColor(...neonPurple);
    doc.line(0, 2, pageWidth, 2);

    // Header section with gradient effect
    doc.setFillColor(...darkBg);
    doc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, 50, 'F');

    // Company Logo/Title - Gaming Style
    doc.setTextColor(...neonCyan);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('BIDAYAH PC', margin, yPos + 12);
    
    doc.setFontSize(10);
    doc.setTextColor(...neonPurple);
    doc.text('GAMING PC & COMPONENTS', margin, yPos + 18);
    
    // Invoice label with neon effect
    doc.setFontSize(32);
    doc.setTextColor(...neonCyan);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, yPos + 8, { align: 'right' });
    
    // Invoice details box
    doc.setFillColor(20, 25, 35);
    doc.rect(pageWidth - margin - 50, yPos + 12, 50, 25, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text(`#${order.order_number}`, pageWidth - margin - 2, yPos + 20, { align: 'right' });
    doc.text(format(new Date(order.created_at), 'PP'), pageWidth - margin - 2, yPos + 27, { align: 'right' });

    yPos += 45;

    // Draw decorative line
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setDrawColor(...neonPurple);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    yPos += 12;

    // Customer Info Section - Gaming style box
    doc.setFillColor(20, 25, 35);
    doc.rect(margin, yPos, 85, 65, 'F');
    
    // Border for customer box
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, 85, 65, 'D');
    
    doc.setFontSize(11);
    doc.setTextColor(...neonGreen);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', margin + 3, yPos + 8);
    
    doc.setFontSize(9);
    doc.setTextColor(...lightText);
    doc.setFont('helvetica', 'normal');
    doc.text(customerName, margin + 3, yPos + 15);
    doc.text(customerAddress, margin + 3, yPos + 21);
    doc.text(`${customerCity}, ${customerState}`, margin + 3, yPos + 27);
    doc.text(`${customerZip}, ${customerCountry}`, margin + 3, yPos + 33);
    doc.setTextColor(...mutedText);
    doc.setFontSize(8);
    doc.text(customerEmail, margin + 3, yPos + 40);
    doc.text(customerPhone, margin + 3, yPos + 46);
    doc.text(`Status: ${order.status.replace('_', ' ').toUpperCase()}`, margin + 3, yPos + 52);

    // Order Details Box (right side)
    const orderBoxX = pageWidth - margin - 85;
    doc.setFillColor(20, 25, 35);
    doc.rect(orderBoxX, yPos, 85, 65, 'F');
    
    // Border for order box
    doc.setDrawColor(...neonPurple);
    doc.setLineWidth(1);
    doc.rect(orderBoxX, yPos, 85, 65, 'D');
    
    doc.setFontSize(11);
    doc.setTextColor(...neonPurple);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER INFO:', orderBoxX + 3, yPos + 8);
    
    doc.setFontSize(9);
    doc.setTextColor(...lightText);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment: ${order.payment_method.replace('-', ' ').toUpperCase()}`, orderBoxX + 3, yPos + 18);
    doc.text(`Items: ${order.items?.length || 0}`, orderBoxX + 3, yPos + 24);
    doc.setTextColor(...neonCyan);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', orderBoxX + 3, yPos + 35);
    doc.setFontSize(10);
    doc.text(`AED ${order.subtotal.toLocaleString()}`, orderBoxX + 3, yPos + 42);
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text('+ Shipping & Tax', orderBoxX + 3, yPos + 49);

    yPos += 75;

    // Order Items Table Header - Gaming style
    doc.setFillColor(25, 30, 40);
    doc.rect(margin, yPos - 8, pageWidth - (margin * 2), 12, 'F');
    
    // Decorative border
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(1);
    doc.rect(margin, yPos - 8, pageWidth - (margin * 2), 12, 'D');

    doc.setFontSize(10);
    doc.setTextColor(...neonGreen);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', margin + 3, yPos);
    doc.text('QTY', margin + 105, yPos);
    doc.text('PRICE', margin + 135, yPos);
    doc.text('TOTAL', pageWidth - margin - 3, yPos, { align: 'right' });

    yPos += 8;

    // Order Items with alternating backgrounds
    let itemIndex = 0;
    order.items?.forEach((item) => {
      if (yPos > 240) {
        doc.addPage();
        doc.setFillColor(...darkBg);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin + 10;
      }

      // Alternating row colors
      if (itemIndex % 2 === 0) {
        doc.setFillColor(15, 20, 30);
        doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
      }

      doc.setFontSize(9);
      doc.setTextColor(...lightText);
      doc.setFont('helvetica', 'normal');
      
      // Truncate long product names
      const itemName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
      doc.text(itemName, margin + 3, yPos);
      
      doc.setTextColor(...mutedText);
      doc.text(item.quantity.toString(), margin + 105, yPos);
      doc.text(`AED ${item.price.toLocaleString()}`, margin + 135, yPos);
      
      doc.setTextColor(...neonCyan);
      doc.setFont('helvetica', 'bold');
      doc.text(`AED ${item.subtotal.toLocaleString()}`, pageWidth - margin - 3, yPos, { align: 'right' });
      
      yPos += 8;
      itemIndex++;
    });

    yPos += 8;

    // Totals Section - Gaming style highlight box
    const totalsBoxX = pageWidth - margin - 65;
    const totalsBoxY = yPos;
    
    doc.setFillColor(20, 25, 35);
    doc.rect(totalsBoxX, totalsBoxY, 65, 45, 'F');
    doc.setDrawColor(...neonPurple);
    doc.setLineWidth(2);
    doc.rect(totalsBoxX, totalsBoxY, 65, 45, 'D');
    
    // Inner glow effect (second border)
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(0.5);
    doc.rect(totalsBoxX + 1, totalsBoxY + 1, 63, 43, 'D');

    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsBoxX + 3, totalsBoxY + 10, { align: 'right' });
    doc.setTextColor(...lightText);
    doc.text(`AED ${order.subtotal.toLocaleString()}`, totalsBoxX + 62, totalsBoxY + 10, { align: 'right' });
    
    // Calculate total with updated shipping
    const updatedShipping = shippingCharges || 0;
    const updatedTotal = order.subtotal + updatedShipping + order.tax;

    doc.setTextColor(...mutedText);
    doc.text('Shipping:', totalsBoxX + 3, totalsBoxY + 17, { align: 'right' });
    doc.setTextColor(...lightText);
    doc.text(`AED ${updatedShipping.toLocaleString()}`, totalsBoxX + 62, totalsBoxY + 17, { align: 'right' });
    
    doc.setTextColor(...mutedText);
    doc.text('VAT (5%):', totalsBoxX + 3, totalsBoxY + 24, { align: 'right' });
    doc.setTextColor(...lightText);
    doc.text(`AED ${order.tax.toLocaleString()}`, totalsBoxX + 62, totalsBoxY + 24, { align: 'right' });

    // Decorative line
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(0.5);
    doc.line(totalsBoxX + 3, totalsBoxY + 28, totalsBoxX + 62, totalsBoxY + 28);

    // Total - Highlighted
    doc.setFontSize(14);
    doc.setTextColor(...neonGreen);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsBoxX + 3, totalsBoxY + 38, { align: 'right' });
    doc.setFontSize(16);
    doc.setTextColor(...neonCyan);
    doc.text(`AED ${updatedTotal.toLocaleString()}`, totalsBoxX + 62, totalsBoxY + 38, { align: 'right' });

    yPos += 55;

    // Footer section
    const footerY = pageHeight - 30;
    
    // Decorative line
    doc.setDrawColor(...neonPurple);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(8);
    doc.setTextColor(...neonCyan);
    doc.setFont('helvetica', 'bold');
    doc.text('THANK YOU FOR YOUR BUSINESS!', pageWidth / 2, footerY, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setTextColor(...mutedText);
    doc.setFont('helvetica', 'normal');
    doc.text('Bidayah PC - Premium Gaming Solutions', pageWidth / 2, footerY + 6, { align: 'center' });
    doc.text('www.bidayahpc.com | support@bidayahpc.com', pageWidth / 2, footerY + 11, { align: 'center' });

    // Bottom border
    doc.setDrawColor(...neonCyan);
    doc.setLineWidth(2);
    doc.line(0, pageHeight - 1, pageWidth, pageHeight - 1);

    // Save PDF
    doc.save(`Invoice-${order.order_number}.pdf`);
  };

  if (!order) return null;

  const orderDate = format(new Date(order.created_at), 'PPpp');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-2xl">INVOICE GENERATOR</DialogTitle>
          <DialogDescription>
            Review and verify order details before generating the invoice PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer Details Section */}
          <div className="space-y-4">
            <h3 className="font-orbitron text-lg font-bold text-primary">CUSTOMER DETAILS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Full Name</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-country">Country</Label>
                <Input
                  id="customer-country"
                  value={customerCountry}
                  onChange={(e) => setCustomerCountry(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-city">City</Label>
                <Input
                  id="customer-city"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-state">State</Label>
                <Input
                  id="customer-state"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-zip">ZIP Code</Label>
                <Input
                  id="customer-zip"
                  value={customerZip}
                  onChange={(e) => setCustomerZip(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Details Section */}
          <div className="space-y-4">
            <h3 className="font-orbitron text-lg font-bold text-primary">ORDER DETAILS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="shipping-charges">Shipping Charges (AED)</Label>
                <Input
                  id="shipping-charges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCharges}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setShippingCharges(value);
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Update shipping charges for this invoice
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-semibold font-mono">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-semibold">{orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-semibold capitalize">{order.payment_method.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold capitalize">{order.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-orbitron text-lg font-bold text-primary">ORDER ITEMS</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold">Item</th>
                    <th className="p-3 text-center text-sm font-semibold">Quantity</th>
                    <th className="p-3 text-right text-sm font-semibold">Price</th>
                    <th className="p-3 text-right text-sm font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={item.id || index} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{item.name}</div>
                        {item.category && (
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">AED {item.price.toLocaleString()}</td>
                      <td className="p-3 text-right font-semibold">
                        AED {item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-semibold">
                      Subtotal:
                    </td>
                    <td className="p-3 text-right font-semibold">
                      AED {order.subtotal.toLocaleString()}
                    </td>
                  </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-right">
                        Shipping:
                      </td>
                      <td className="p-3 text-right">AED {shippingCharges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-right">
                        Tax:
                      </td>
                      <td className="p-3 text-right">AED {order.tax.toLocaleString()}</td>
                    </tr>
                    <tr className="border-t-2">
                      <td colSpan={3} className="p-3 text-right font-orbitron font-bold text-lg">
                        Total:
                      </td>
                      <td className="p-3 text-right font-orbitron font-bold text-lg text-primary">
                        AED {(order.subtotal + shippingCharges + order.tax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <CyberButton
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </CyberButton>
            <CyberButton onClick={generatePDF}>
              <Download className="w-4 h-4 mr-2" />
              Download Invoice PDF
            </CyberButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceGenerator;
