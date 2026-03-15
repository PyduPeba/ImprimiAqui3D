import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async generatePdf(html: string): Promise<Buffer> {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm',
                },
            });
            return Buffer.from(pdfBuffer);
        } catch (error) {
            this.logger.error('Error generating PDF', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async generateQuoteHtml(quoteData: any, settings: any = {}): Promise<string> {
        const { customer, items = [], subtotal = 0, discount = 0, total = 0 } = quoteData;
        const branding = settings.branding || {};
        const reports = settings.reports || {};
        const finance = settings.finance || {};

        console.log('[PdfService] generateQuoteHtml - Branding data:', {
            storeName: branding.storeName,
            storeEmail: branding.storeEmail,
            storePhone: branding.storePhone
        });

        // Safe number formatting helper
        const formatMoney = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
        };

        // --- Logo Handling (Base64 for reliable Puppeteer rendering) ---
        let logoHtml = `<div class="logo">ImprimiAqui3D</div><div class="logo-sub">Impressão 3D Profissional</div>`;

        if (branding.logoUrl) {
            try {
                // Resolve absolute path. Assumes logoUrl starts with /uploads/
                const fs = require('fs');
                const path = require('path');
                const logoPath = path.join(process.cwd(), branding.logoUrl);

                if (fs.existsSync(logoPath)) {
                    const bitmap = fs.readFileSync(logoPath);
                    const base64Logo = Buffer.from(bitmap).toString('base64');
                    const ext = path.extname(logoPath).substring(1); // e.g. png, jpg
                    const mimeType = ext === 'jpg' ? 'jpeg' : ext;

                    logoHtml = `<img src="data:image/${mimeType};base64,${base64Logo}" alt="Logo" style="max-height: 80px; max-width: 200px;">`;
                }
            } catch (err) {
                this.logger.warn('Failed to embed logo into PDF', err);
                // Fallback is already set
            }
        }

        const termsHtml = reports.termsAndConditions // Corrected key from 'terms' to 'termsAndConditions' from entity
            ? reports.termsAndConditions.replace(/\n/g, '<br>')
            : `• Validade do orçamento: 15 dias<br>• Prazo de entrega: A combinar após confirmação<br>• Forma de pagamento: A combinar`;

        const footerHtml = reports.footerText
            ? `<div style="text-align: center; font-size: 10px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">${reports.footerText}</div>`
            : '';

        // --- Financial Calculations ---
        let paymentInfoHtml = '';
        if (finance.paymentMethods) {
            const { pix, creditCard } = finance.paymentMethods;

            // Pix
            let pixHtml = '';
            if (pix && pix.discount > 0) {
                const pixVal = total * (1 - (pix.discount / 100));
                pixHtml = `<div class="payment-row">
                    <strong>Pix / Dinheiro (${pix.discount}% off):</strong> 
                    R$ ${formatMoney(pixVal)}
                </div>`;
            } else {
                pixHtml = `<div class="payment-row"><strong>Pix / Dinheiro:</strong> R$ ${formatMoney(total)}</div>`;
            }

            // Credit Card
            let cardHtml = '';
            if (creditCard && creditCard.installments && creditCard.installments.length > 0) {
                cardHtml = `<div class="payment-group"><strong>Cartão de Crédito:</strong>`;
                creditCard.installments.forEach((inst: any) => {
                    // Logic: Total with interest = Total * (1 + rate/100)
                    // Installment Value = TotalWithInterest / Count

                    const rate = Number(inst.rate || 0);
                    const totalWithRate = total * (1 + (rate / 100));
                    const installmentVal = totalWithRate / inst.count;

                    const label = rate === 0 ? 'sem juros' : `(Total: R$ ${formatMoney(totalWithRate)})`;

                    cardHtml += `<div class="installment-row">
                        ${inst.count}x de R$ ${formatMoney(installmentVal)} ${label}
                    </div>`;
                });
                cardHtml += `</div>`;
            }

            paymentInfoHtml = `
            <div class="section payment-info">
                <div class="section-title">Formas de Pagamento</div>
                <div class="payment-grid">
                    ${pixHtml}
                    ${cardHtml}
                </div>
            </div>`;
        }


        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Orçamento - ImprimiAqui3D</title>
    <style>
        @page { size: A4 portrait; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
         body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${branding.primaryColor || '#6366F1'}; }
        .logo-column { flex: 0 0 150px; }
        .store-column { flex: 1; padding: 0 20px; }
        .type-column { flex: 0 0 200px; text-align: right; }
        .brand-name { font-size: 14px; font-weight: 800; color: ${branding.primaryColor || '#6366F1'}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .brand-contact { font-size: 10px; color: #666; font-weight: 500; line-height: 1.4; }
        .logo { font-size: 28px; font-weight: bold; color: ${branding.primaryColor || '#6366F1'}; }
        .doc-type { text-align: right; }
        .doc-type h1 { font-size: 24px; color: ${branding.primaryColor || '#6366F1'}; margin-bottom: 5px; }
        .doc-number { font-size: 14px; color: #666; }
        .date { font-size: 12px; color: #666; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: bold; color: #1F2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #E5E7EB; }
        .customer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: ${branding.primaryColor || '#6366F1'}; color: white; padding: 10px; text-align: left; font-size: 11px; font-weight: bold; }
        td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; font-size: 12px; }
        .item-name { font-weight: bold; }
        .item-details { font-size: 10px; color: #666; margin-top: 3px; }
        .accessory-row { background: #F9FAFB; }
        .accessory-row td { padding: 5px 10px; font-size: 11px; color: #666; font-style: italic; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { margin-top: 30px; float: right; width: 300px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
        .totals-row.discount { color: #EF4444; }
        .totals-row.total { font-size: 16px; font-weight: bold; padding-top: 15px; border-top: 2px solid #E5E7EB; }
        .totals-row.total .amount { color: ${branding.primaryColor || '#6366F1'}; font-size: 20px; }
        
        .payment-info { clear: both; padding-top: 20px; page-break-inside: avoid; }
        .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #F9FAFB; padding: 15px; border-radius: 8px; font-size: 12px; }
        .payment-row { margin-bottom: 5px; }
        .installment-row { color: #555; margin-left: 10px; margin-bottom: 2px; }
        
        .notes { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
        .notes-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
        .notes-content { font-size: 11px; color: #666; line-height: 1.8; }
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-column">
            ${logoHtml}
        </div>
        <div class="store-column">
            <div class="brand-name">
                ${branding.storeName || 'ImprimiAqui3D'}
            </div>
            <div class="brand-contact">
                ${branding.storeEmail ? `<div>Email: ${branding.storeEmail}</div>` : ''} 
                ${branding.storePhone ? `<div>WhatsApp: ${branding.storePhone}</div>` : ''}
            </div>
        </div>
        <div class="type-column">
            <div class="doc-type">
                <h1>ORÇAMENTO</h1>
                <div class="doc-number">#${quoteData.code || quoteData.id || 'RASCUNHO'}</div>
            </div>
        </div>
    </div>

    <div class="date">Data: ${new Date().toLocaleDateString('pt-BR')}</div>

    ${customer ? `
    <div class="section">
        <div class="section-title">Cliente</div>
        <div class="customer-info">
            <div><strong>Nome:</strong> ${customer.name}</div>
            <div><strong>Email:</strong> ${customer.email || '-'}</div>
             <div><strong>Telefone:</strong> ${customer.phone || '-'}</div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Itens do Orçamento</div>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-center" style="width: 60px;">Qtd</th>
                    <th class="text-center" style="width: 70px;">Peso (g)</th>
                    <th class="text-right" style="width: 100px;">Preço Unit.</th>
                    <th class="text-right" style="width: 100px;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item: any) => {
            const unitPrice = Number(item.unitPrice || 0);
            const quantity = Number(item.quantity || 1);
            const itemTotal = unitPrice * quantity;

            const accessoriesTotal = item.accessories?.reduce(
                (sum: number, acc: any) => sum + (Number(acc.unitPrice || 0) * Number(acc.quantity || 1)),
                0
            ) || 0;

            const total = itemTotal + accessoriesTotal;
            const showMargin = reports.showMargins;
            const marginHtml = showMargin && item.profitMargin ? `<div style="color: #10B981; font-size: 9px; font-weight: bold; margin-top: 2px;">Margem: ${Number(item.profitMargin)}%</div>` : '';

            let html = `
                    <tr>
                        <td>
                            <div class="item-name">${item.name || item.fileName || 'Item Personalizado'}</div>
                            <div class="item-details">
                                Material: ${item.materialName || item.material?.name || '-'} | 
                                Impressora: ${item.printerName || item.printer?.name || '-'}
                                ${marginHtml}
                            </div>
                        </td>
                        <td class="text-center">${quantity}</td>
                        <td class="text-center">${item.weight || 0}g</td>
                        <td class="text-right">R$ ${formatMoney(unitPrice)}</td>
                        <td class="text-right"><strong>R$ ${formatMoney(total)}</strong></td>
                    </tr>`;

            // Add accessories
            if (item.accessories && item.accessories.length > 0) {
                item.accessories.forEach((acc: any) => {
                    const accPrice = Number(acc.unitPrice || 0);
                    const accQty = Number(acc.quantity || 1);
                    html += `
                            <tr class="accessory-row">
                                <td>&nbsp;&nbsp;+ ${acc.name || acc.accessory?.name}</td>
                                <td class="text-center">${accQty}</td>
                                <td class="text-center">-</td>
                                <td class="text-right">R$ ${formatMoney(accPrice)}</td>
                                <td class="text-right">R$ ${formatMoney(accPrice * accQty)}</td>
                            </tr>`;
                });
            }

            return html;
        }).join('')}
            </tbody>
        </table>
    </div>

    <div class="totals">
        <div class="totals-row">
            <span>Subtotal:</span>
            <span>R$ ${formatMoney(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="totals-row discount">
            <span>Desconto:</span>
            <span>- R$ ${formatMoney(discount)}</span>
        </div>
        ` : ''}
        <div class="totals-row total">
            <span>TOTAL:</span>
            <span class="amount">R$ ${formatMoney(total)}</span>
        </div>
    </div>

    <div style="clear: both; margin-bottom: 30px;"></div>

    ${paymentInfoHtml}

    <div class="notes" style="page-break-inside: avoid;">
        <div class="notes-title">Observações e Termos</div>
        <div class="notes-content">
            ${termsHtml}
        </div>
    </div>

    ${footerHtml}
</body>
</html>
        `.trim();
    }
}
