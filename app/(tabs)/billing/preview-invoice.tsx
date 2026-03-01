import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';


import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getCustomers } from '../../../utils/storage';

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { createBillApi } from '@/services/protected';
import { PDFDocument, StandardFonts } from 'pdf-lib';


// const SHOP_NAME = 'Your Grocer Shop';
// const SHOP_ADDRESS = '123 Main Street, Meerut, UP';
// const SHOP_PHONE = '+919876543210';

type StatusType = 'FULL' | 'PARTIAL';

export default function PreviewInvoice() {
  const { customerId, items: itemsJson, total } = useLocalSearchParams();
  const totalAmount = Number(total || 0);

  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<StatusType>('FULL');
  const [paidAmount, setPaidAmount] = useState('');
  const [billCreated, setBillCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    businessName: string;
    businessAddress: string;
    businessPhone: string;
  } | null>(null);

  // Animated success message
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCustomer();
    try {
      setItems(JSON.parse((itemsJson as string) || '[]'));
    } catch {
      setItems([]);
    }
  }, [itemsJson]);

  const loadCustomer = async () => {
    const custs = await getCustomers();
    const found = custs.find((c: any) => c.id == customerId);
    setCustomer(found || null);

    const profiledata = await AsyncStorage.getItem('profiledata');
    const userData = await AsyncStorage.getItem('user');
    
     if (profiledata && userData) {
    try {
      const parsed = JSON.parse(profiledata);
      const parserUser = JSON.parse(userData);

      setProfile({
        businessName: parsed.business_name || '',
        businessAddress: parsed.business_address || '',
        businessPhone: parserUser.phone || '',
      });
    } catch (err) {
      console.log('Profile parse error', err);
    }
  }
    
  };

  const paid = Number(paidAmount) || 0;
  const remaining = Math.max(totalAmount - paid, 0);

  const canGeneratePDF =
    status === 'FULL' || (status === 'PARTIAL' && paid <= totalAmount);

  // Finish Billing → call API → show animated success message
  const finishBilling = async () => {
    if (!canGeneratePDF) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerId: Number(customerId),
        totalAmount,
        status,
        paidAmount: status === 'FULL' ? totalAmount : paid,
        remainingAmount: status === 'FULL' ? 0 : remaining,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.unitType === 'weight' ? item.grams / 1000 : item.quantity || 1,
          price: item.price,
          total: item.calculatedPrice || item.price,
          unit_type: item.unitType || null,
        })),
      };


      const response = await createBillApi(payload);

      if (response.success) {
        setBillCreated(true);

        // Show animated success message
        setShowSuccess(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();

        // Auto hide after 3 seconds
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => setShowSuccess(false));
        }, 3000);
      } else {
          // Show animated success message
        setShowError(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();

        // Auto hide after 3 seconds
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => setShowError(false));
        }, 3000);
      }
    } catch (err: any) {
      // Optional: show error toast if you want
      // Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!canGeneratePDF) return;

    if (!customer?.phone) return;

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = 800;

      page.drawText(profile?.businessName || 'Business Name', { x: 50, y, size: 22, font: bold });
      y -= 18;
      page.drawText(profile?.businessAddress || 'Business Address', { x: 50, y, size: 11, font });
      y -= 14;
      page.drawText(`Phone: ${profile?.businessPhone || 'Business Phone'}`, { x: 50, y, size: 11, font });

      page.drawLine({ start: { x: 50, y: y - 10 }, end: { x: 545, y: y - 10 }, thickness: 1 });

      y -= 40;

      page.drawText('INVOICE', { x: 50, y, size: 16, font: bold });
      y -= 24;

      page.drawText(`Customer: ${customer.name}`, { x: 50, y, size: 12, font });
      y -= 16;
      page.drawText(`Phone: ${customer.phone}`, { x: 50, y, size: 12, font });
      y -= 28;

      page.drawText('Item', { x: 50, y, size: 12, font: bold });
      page.drawText('Qty', { x: 300, y, size: 12, font: bold });
      page.drawText('Amount (Rs.)', { x: 420, y, size: 12, font: bold });

      y -= 10;
      page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 });

      y -= 18;

      items.forEach((item: any) => {
        const qty = item.grams
          ? `${(item.grams / 1000).toFixed(2)} kg`
          : item.quantity || 1;

        const amt = Number(item.calculatedPrice || item.price || 0).toFixed(2);

        page.drawText(item.name, { x: 50, y, size: 11, font });
        page.drawText(String(qty), { x: 300, y, size: 11, font });
        page.drawText(`Rs. ${amt}`, { x: 420, y, size: 11, font });

        y -= 18;
      });

      y -= 10;
      page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 });

      y -= 24;

      page.drawText('Total:', { x: 320, y, size: 12, font: bold });
      page.drawText(`Rs. ${totalAmount.toFixed(2)}`, { x: 440, y, size: 12, font });

      if (status === 'PARTIAL') {
        y -= 18;
        page.drawText('Paid:', { x: 320, y, size: 11, font });
        page.drawText(`Rs. ${paid.toFixed(2)}`, { x: 440, y, size: 11, font });

        y -= 16;
        page.drawText('Remaining:', { x: 320, y, size: 11, font });
        page.drawText(`Rs. ${remaining.toFixed(2)}`, { x: 440, y, size: 11, font });
      }

      const pdfBytes = await pdfDoc.save();
      const file = new File(Paths.cache, `invoice_${Date.now()}.pdf`);
      await file.create({ intermediates: true });
      await file.write(pdfBytes);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Invoice',
      });
    } catch (err: any) {
      console.error('PDF generation error:', err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invoice Preview</Text>
        <Text style={styles.headerSub}>
          {customer?.name} • {customer?.phone}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Selected Items</Text>

        {items.map((item, idx) => {
          const qty = item.grams
            ? `${(item.grams / 1000).toFixed(2)} kg`
            : item.quantity || 1;

          return (
            <View key={idx} style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {qty}</Text>
              </View>
              <Text style={styles.itemPrice}>
                ₹{Number(item.calculatedPrice || item.price || 0).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Status</Text>

        <View style={styles.statusRow}>
          <Pressable
            onPress={() => setStatus('FULL')}
            style={[
              styles.statusBtn,
              status === 'FULL' && styles.activeBtn,
            ]}
          >
            <Text style={styles.statusText}>Fully Paid</Text>
          </Pressable>

          <Pressable
            onPress={() => setStatus('PARTIAL')}
            style={[
              styles.statusBtn,
              status === 'PARTIAL' && styles.activeBtn,
            ]}
          >
            <Text style={styles.statusText}>Partially Paid</Text>
          </Pressable>
        </View>

        {status === 'PARTIAL' && (
          <>
            <Text style={styles.label}>Paid Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={paidAmount}
              onChangeText={setPaidAmount}
            />
            <Text style={styles.remaining}>
              Remaining: ₹{remaining.toFixed(2)}
            </Text>
          </>
        )}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
      </View>

      {/* Success message above button */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successMessage,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }) }],
            },
          ]}
        >
          <Text style={styles.successText}>Bill Created Successfully!</Text>
        </Animated.View>
      )}


      {/* Error message above button */}
      {showError && (
        <Animated.View
          style={[
            styles.errorMessage,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }) }],
            },
          ]}
        >
          <Text style={styles.errorText}>Bill Creation failed!</Text>
        </Animated.View>
      )}

      {/* Conditional Buttons */}
      {!billCreated ? (
        <Pressable
          disabled={!canGeneratePDF || loading}
          style={[
            styles.finishBtn,
            (!canGeneratePDF || loading) && styles.disabled,
          ]}
          onPress={finishBilling}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.finishText}>Finish Billing</Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          onPress={generatePDF}
          disabled={!canGeneratePDF}
          style={[styles.generateBtn, !canGeneratePDF && styles.disabled]}
        >
          <Text style={styles.generateText}>Generate & Share Invoice</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

/* ───────────────────── STYLES (added successMessage only) ───────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 12,
  },

  header: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#CBD5E1',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    color: '#0F172A',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  itemName: {
    fontSize: 13,
    color: '#020617',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  itemQty: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  itemPrice: {
    fontSize: 13,
    color: '#16A34A',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },

  activeBtn: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },

  statusText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  label: {
    marginTop: 10,
    fontSize: 12,
    color: '#334155',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  remaining: {
    marginTop: 6,
    fontSize: 12,
    color: '#DC2626',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },

  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  totalValue: {
    fontSize: 22,
    color: '#020617',
    marginTop: 4,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  generateBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  finishBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  generateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  finishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  // New animated success message (above button)
  successMessage: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  successText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },

  errorMessage: {
    backgroundColor: '#af0909',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold_Italic',
  },
});