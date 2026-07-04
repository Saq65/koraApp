import React, { useEffect, useState, useCallback } from 'react'
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AppBackground from "@/components/AppBackground"
import { useTheme } from '@react-navigation/native'
import { router } from 'expo-router'
import { getWallet, WalletTransaction } from '@/src/api/wallet'

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    } catch {
        return '';
    }
};

const titleForTransaction = (txn: WalletTransaction) => {
    if (txn.type === 'refund') {
        return txn.orderNumber ? `Refund - Order #${txn.orderNumber}` : 'Refund';
    }
    if (txn.type === 'debit') {
        return txn.orderNumber ? `Paid - Order #${txn.orderNumber}` : 'Payment';
    }
    if (txn.type === 'cashback') return 'Cashback';
    return txn.reason || 'Wallet Credit';
};

const TransactionIcon = ({ type }: { type: string }) => {
    const getIconStyle = () => {
        switch (type) {
            case 'refund':
                return { bg: '#E8F5E9', color: '#4CAF50', symbol: '↙' }
            case 'paid':
                return { bg: '#FFEBEE', color: '#F44336', symbol: '↗' }
            case 'added':
            case 'credit':
                return { bg: '#E3F2FD', color: '#2196F3', symbol: '+' }
            case 'cashback':
                return { bg: '#FFF8E1', color: '#FFC107', symbol: '🎁' }
            default:
                return { bg: '#F5F5F5', color: '#9E9E9E', symbol: '•' }
        }
    }
    const icon = getIconStyle()
    return (
        <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
            <Text style={[styles.iconSymbol, { color: icon.color }]}>{icon.symbol}</Text>
        </View>
    )
}

const Wallet = () => {
    const { colors } = useTheme()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<WalletTransaction[]>([])

    const loadWallet = useCallback(async () => {
        try {
            const res = await getWallet()
            if (res.success && res.data) {
                setBalance(res.data.balance ?? 0)
                setTransactions(res.data.transactions ?? [])
            }
        } catch (error) {
            console.log('Error loading wallet:', error)
        }
    }, [])

    useEffect(() => {
        (async () => {
            setLoading(true)
            await loadWallet()
            setLoading(false)
        })()
    }, [loadWallet])

    const onRefresh = async () => {
        setRefreshing(true)
        await loadWallet()
        setRefreshing(false)
    }

    const listData = transactions.map(txn => ({
        id: txn.id,
        type: txn.type,
        title: titleForTransaction(txn),
        date: formatDate(txn.createdAt),
        amount: `${txn.type === 'debit' ? '-' : '+'}₹${Math.abs(txn.amount)}`,
        positive: txn.type !== 'debit',
    }))

    const ListHeader = () => (
        <>
            {/* Wallet Card */}
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.walletIconRow}>
                        <View style={styles.walletIconBox}>
                            <Text style={styles.walletIconText}>💳</Text>
                        </View>
                        <Text style={styles.walletName}>KORA Wallet</Text>
                    </View>
                    <Text style={styles.availableText}>AVAILABLE</Text>
                </View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.addBtn}>
                        <Text style={styles.addBtnText}>+ Add Money</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.withdrawBtn}>
                        <Text style={styles.withdrawBtnText}>⬇  Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Refund Notice */}
            <View style={[styles.noticeBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.noticeIcon}>🎁</Text>
                <Text style={[styles.noticeText, { color: colors.text }]}>
                    All refunds from cancelled or adjusted orders are credited instantly to your wallet.
                </Text>
            </View>

            {/* Section Title */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        </>
    )

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <AppBackground>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={colors.background}
                    translucent={false}
                />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={()=>router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
                        <Ionicons name="arrow-back" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>My Wallet</Text>
                </View>

                {/* Single FlatList handles all scrolling — no overflow */}
                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={<ListHeader />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: colors.text, opacity: 0.6, marginTop: 20 }}>
                            No transactions yet
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>
                            <TransactionIcon type={item.type} />
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={styles.transactionDate}>{item.date}</Text>
                            </View>
                            <Text
                                style={[
                                    styles.transactionAmount,
                                    item.positive ? styles.amountPositive : styles.amountNegative,
                                ]}
                            >
                                {item.amount}
                            </Text>
                        </View>
                    )}
                />
            </AppBackground>
        </SafeAreaView>
    )
}

export default Wallet

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    backBtn: {
        marginRight: 12,
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },

    // Wallet Card
    card: {
        marginHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#2E7D6B',
        padding: 20,
        shadowColor: '#2E7D6B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    walletIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    walletIconBox: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletIconText: {
        fontSize: 16,
    },
    walletName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 6,
    },
    availableText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        marginBottom: 4,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 20,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    addBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addBtnText: {
        color: '#2E7D6B',
        fontWeight: '700',
        fontSize: 14,
    },
    withdrawBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    withdrawBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // Notice Banner
    noticeBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 10,
        padding: 12,
        gap: 8,
        borderWidth: 1,
    },
    noticeIcon: {
        fontSize: 16,
        marginTop: 1,
    },
    noticeText: {
        flex: 1,
        fontSize: 12.5,
        lineHeight: 18,
    },

    // Section Title
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
    },

    // Transaction List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 10,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconSymbol: {
        fontSize: 18,
        fontWeight: '700',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 3,
    },
    transactionDate: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
    },
    amountPositive: {
        color: '#2E7D6B',
    },
    amountNegative: {
        color: '#F44336',
    },
})