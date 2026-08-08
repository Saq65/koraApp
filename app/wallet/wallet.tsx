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
import { useTheme } from '@/src/theme/ThemeProvider'
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
    const { theme } = useTheme()
    const getIconStyle = () => {
        switch (type) {
            case 'refund':
                return { bg: theme.primaryLight, color: theme.primary, symbol: '↙' }
            case 'debit':
                return { bg: theme.card, color: theme.subText, symbol: '↗' }
            case 'added':
            case 'credit':
                return { bg: theme.primaryLight, color: theme.primary, symbol: '+' }
            case 'cashback':
                return { bg: theme.primaryLight, color: theme.primary, symbol: '🎁' }
            default:
                return { bg: theme.card, color: theme.subText, symbol: '•' }
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
    const { theme, isDarkMode } = useTheme()
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
            <View style={[styles.card, { backgroundColor: theme.primary, shadowColor: theme.primary }]}> 
                <View style={styles.cardTop}>
                    <View style={styles.walletIconRow}>
                        <View style={styles.walletIconBox}>
                            <Text style={[styles.walletIconText, { color: theme.white }]}>💳</Text>
                        </View>
                        <Text style={[styles.walletName, { color: theme.white }]}>KORA Wallet</Text>
                    </View>
                    <Text style={[styles.availableText, { color: theme.white }]}>AVAILABLE</Text>
                </View>
                <Text style={[styles.balanceLabel, { color: theme.white }]}>Total Balance</Text>
                <Text style={[styles.balanceAmount, { color: theme.white }]}>₹{balance.toLocaleString('en-IN')}</Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.white }]}> 
                        <Text style={[styles.addBtnText, { color: theme.primary }]}>+ Add Money</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.withdrawBtn, { backgroundColor: theme.white, borderColor: theme.white, opacity: 0.15 }]}> 
                        <Text style={[styles.withdrawBtnText, { color: theme.white }]}>⬇  Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Refund Notice */}
            <View style={[styles.noticeBanner, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                <Text style={styles.noticeIcon}>🎁</Text>
                <Text style={[styles.noticeText, { color: theme.text }]}> 
                    All refunds from cancelled or adjusted orders are credited instantly to your wallet.
                </Text>
            </View>

            {/* Section Title */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
        </>
    )

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <AppBackground>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                    backgroundColor={theme.background}
                    translucent={false}
                />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.background }]}> 
                    <TouchableOpacity onPress={()=>router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}> 
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>My Wallet</Text>
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
                        <Text style={{ textAlign: 'center', color: theme.text, opacity: 0.6, marginTop: 20 }}>
                            No transactions yet
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.transactionCard, { backgroundColor: theme.card, shadowColor: theme.border }]}> 
                            <TransactionIcon type={item.type} />
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.transactionTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.transactionDate, { color: theme.subText }]}>{item.date}</Text>
                            </View>
                            <Text
                                style={[
                                    styles.transactionAmount,
                                    item.positive ? { color: theme.primary } : { color: theme.secondary ?? theme.text },
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
        padding: 20,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletIconText: {
        fontSize: 16,
    },
    walletName: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 6,
    },
    availableText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
    },
    balanceLabel: {
        fontSize: 13,
        marginBottom: 4,
    },
    balanceAmount: {
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
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    withdrawBtn: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    withdrawBtnText: {
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
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
    },
})