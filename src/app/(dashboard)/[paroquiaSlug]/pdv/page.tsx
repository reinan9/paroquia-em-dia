'use client'

import { useState, useEffect } from 'react'
import { useParoquia } from '@/contexts/ParoquiaContext'

interface Evento {
    id: string
    titulo: string
    data_inicio: string
    local: string | null
}

interface PontoVenda {
    id: string
    nome: string
    eventos_produtos: Produto[]
}

interface Produto {
    id: string
    nome: string
    preco: number
    estoque_atual: number | null
    ativo: boolean
}

interface CartItem {
    produto_id: string
    nome: string
    preco: number
    quantidade: number
}

interface Pedido {
    id: string
    comprador_nome: string | null
    total: number
    status: string
    metodo_pagamento: string | null
    created_at: string
}

export default function PdvPage() {
    const { paroquiaId, loading: ctxLoading } = useParoquia()
    const [view, setView] = useState<'selecao' | 'venda' | 'dashboard'>('selecao')

    // Selection state
    const [eventos, setEventos] = useState<Evento[]>([])
    const [pontosVenda, setPontosVenda] = useState<PontoVenda[]>([])
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null)
    const [selectedPdv, setSelectedPdv] = useState<PontoVenda | null>(null)

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([])
    const [buyerName, setBuyerName] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<string>('')
    const [showCheckout, setShowCheckout] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [lastOrderSuccess, setLastOrderSuccess] = useState(false)

    // Dashboard state
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [loadingPedidos, setLoadingPedidos] = useState(false)

    const total = cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

    useEffect(() => {
        if (paroquiaId) fetchEventos()
    }, [paroquiaId])

    async function fetchEventos() {
        const res = await fetch(`/api/pdv?paroquia_id=${paroquiaId}`)
        if (res.ok) {
            const data = await res.json()
            setEventos(Array.isArray(data) ? data : [])
        }
    }

    async function selectEvento(evento: Evento) {
        setSelectedEvento(evento)
        const res = await fetch(`/api/pdv?paroquia_id=${paroquiaId}&evento_id=${evento.id}`)
        if (res.ok) {
            const data = await res.json()
            setPontosVenda(Array.isArray(data) ? data : [])
        }
    }

    function selectPdv(pdv: PontoVenda) {
        setSelectedPdv(pdv)
        setView('venda')
    }

    function addToCart(product: Produto) {
        setCart(prev => {
            const existing = prev.find(i => i.produto_id === product.id)
            if (existing) {
                return prev.map(i => i.produto_id === product.id ? { ...i, quantidade: i.quantidade + 1 } : i)
            }
            return [...prev, { produto_id: product.id, nome: product.nome, preco: product.preco, quantidade: 1 }]
        })
    }

    function updateQuantity(productId: string, delta: number) {
        setCart(prev => {
            return prev.map(i => {
                if (i.produto_id === productId) {
                    const newQty = i.quantidade + delta
                    return newQty <= 0 ? null : { ...i, quantidade: newQty }
                }
                return i
            }).filter(Boolean) as CartItem[]
        })
    }

    function removeFromCart(productId: string) {
        setCart(prev => prev.filter(i => i.produto_id !== productId))
    }

    async function handleFinalize() {
        if (cart.length === 0 || !paymentMethod) return
        setProcessing(true)

        const res = await fetch('/api/pdv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'criar_pedido',
                ponto_venda_id: selectedPdv?.id,
                paroquia_id: paroquiaId,
                comprador_nome: buyerName || 'Cliente',
                itens: cart.map(i => ({
                    produto_id: i.produto_id,
                    quantidade: i.quantidade,
                    preco_unitario: i.preco,
                })),
            }),
        })

        if (res.ok) {
            const pedido = await res.json()
            // Mark as paid
            await fetch('/api/pdv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'pagar_pedido',
                    pedido_id: pedido.id,
                    metodo_pagamento: paymentMethod,
                }),
            })

            setLastOrderSuccess(true)
            setCart([])
            setBuyerName('')
            setPaymentMethod('')
            setShowCheckout(false)
            setTimeout(() => setLastOrderSuccess(false), 3000)
        }
        setProcessing(false)
    }

    async function fetchDashboard() {
        if (!selectedPdv) return
        setLoadingPedidos(true)
        const res = await fetch(`/api/pdv?paroquia_id=${paroquiaId}&ponto_venda_id=${selectedPdv.id}`)
        if (res.ok) {
            const data = await res.json()
            setPedidos(Array.isArray(data) ? data : [])
        }
        setLoadingPedidos(false)
    }

    function handlePrintReceipt() {
        // Print the last order receipt using browser print
        const receiptContent = `
            <div style="font-family: monospace; font-size: 12px; width: 280px; padding: 10px;">
                <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
                    <strong>PARÓQUIA EM DIA</strong><br/>
                    ${selectedEvento?.titulo || 'Evento'}<br/>
                    ${selectedPdv?.nome || 'PDV'}
                </div>
                <div style="margin-bottom: 8px;">
                    ${cart.length > 0 ? cart.map(i => `${i.quantidade}x ${i.nome} ... R$ ${(i.preco * i.quantidade).toFixed(2)}`).join('<br/>') : 'Pedido finalizado'}
                </div>
                <div style="border-top: 1px dashed #000; padding-top: 8px; text-align: right;">
                    <strong>TOTAL: R$ ${total.toFixed(2)}</strong>
                </div>
                <div style="text-align: center; margin-top: 12px; font-size: 10px; color: #666;">
                    ${new Date().toLocaleString('pt-BR')}<br/>
                    Obrigado!
                </div>
            </div>
        `
        const printWindow = window.open('', '_blank', 'width=320,height=500')
        if (printWindow) {
            printWindow.document.write(receiptContent)
            printWindow.document.close()
            printWindow.print()
        }
    }

    if (ctxLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

    // =============== SELECTION VIEW ===============
    if (view === 'selecao') {
        return (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🛒 Ponto de Venda (PDV)</h1>
                    <p className="text-gray-500 text-sm mt-1">Registre vendas durante eventos</p>
                </div>

                {!selectedEvento ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Selecionar Evento</h3>
                        {eventos.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <span className="text-4xl mb-3 block">🎉</span>
                                <p className="font-semibold text-gray-900 mb-1">Nenhum evento com vendas</p>
                                <p className="text-sm">Crie um evento com &quot;tem vendas&quot; ativado para começar.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {eventos.map(e => (
                                    <button key={e.id} onClick={() => selectEvento(e)}
                                        className="p-5 border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group">
                                        <p className="font-semibold text-gray-900 group-hover:text-blue-700">{e.titulo}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            📅 {new Date(e.data_inicio).toLocaleDateString('pt-BR')}
                                            {e.local && ` • 📍 ${e.local}`}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button onClick={() => { setSelectedEvento(null); setPontosVenda([]) }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            ← Voltar aos eventos
                        </button>

                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="font-semibold text-blue-900">{selectedEvento.titulo}</p>
                            <p className="text-xs text-blue-600">
                                📅 {new Date(selectedEvento.data_inicio).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Selecionar Barraca / Ponto de Venda</h3>
                            {pontosVenda.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="text-3xl mb-2 block">🏪</span>
                                    <p className="text-sm">Nenhum ponto de venda cadastrado para este evento.</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {pontosVenda.map(pdv => (
                                        <button key={pdv.id} onClick={() => selectPdv(pdv)}
                                            className="p-5 border border-gray-200 rounded-xl text-left hover:border-green-400 hover:bg-green-50 transition-all group">
                                            <p className="font-semibold text-gray-900 group-hover:text-green-700">{pdv.nome}</p>
                                            <p className="text-xs text-gray-400 mt-1">{pdv.eventos_produtos?.length || 0} produtos</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // =============== SALE VIEW (Mobile-first) ===============
    if (view === 'venda') {
        const produtos = selectedPdv?.eventos_produtos?.filter(p => p.ativo) || []

        return (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {/* Top bar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setView('selecao'); setCart([]) }}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            ←
                        </button>
                        <div>
                            <h2 className="font-bold text-gray-900">{selectedPdv?.nome}</h2>
                            <p className="text-xs text-gray-400">{selectedEvento?.titulo}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setView('dashboard'); fetchDashboard() }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all">
                            📊 Dashboard
                        </button>
                    </div>
                </div>

                {/* Success banner */}
                {lastOrderSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center animate-[fadeIn_0.3s_ease-out]">
                        <span className="text-2xl">✅</span>
                        <p className="font-semibold text-green-800">Pedido finalizado com sucesso!</p>
                    </div>
                )}

                {/* Products grid (mobile-first: big touch targets) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Produtos</h3>
                    {produtos.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">Nenhum produto cadastrado neste ponto de venda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {produtos.map(product => {
                                const inCart = cart.find(i => i.produto_id === product.id)
                                return (
                                    <button key={product.id} onClick={() => addToCart(product)}
                                        className={`relative p-4 border-2 rounded-xl text-center transition-all active:scale-95 ${inCart
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                            }`}>
                                        {inCart && (
                                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                                                {inCart.quantidade}
                                            </span>
                                        )}
                                        <p className="font-semibold text-gray-900 text-sm">{product.nome}</p>
                                        <p className="text-green-600 font-bold text-lg mt-1">
                                            R$ {product.preco.toFixed(2).replace('.', ',')}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Cart (sticky bottom on mobile) */}
                {cart.length > 0 && !showCheckout && (
                    <div className="fixed bottom-0 left-0 right-0 lg:static bg-white border-t lg:border border-gray-200 lg:rounded-2xl p-4 shadow-lg lg:shadow-sm z-40">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Carrinho ({cart.reduce((s, i) => s + i.quantidade, 0)} itens)</h3>
                                <span className="text-xl font-bold text-green-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                                {cart.map(item => (
                                    <div key={item.produto_id} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{item.nome}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQuantity(item.produto_id, -1)}
                                                className="w-8 h-8 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors">−</button>
                                            <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
                                            <button onClick={() => updateQuantity(item.produto_id, 1)}
                                                className="w-8 h-8 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors">+</button>
                                            <button onClick={() => removeFromCart(item.produto_id)}
                                                className="text-red-400 hover:text-red-600 ml-1">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowCheckout(true)}
                                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all text-base active:scale-[0.98]">
                                Finalizar Venda →
                            </button>
                        </div>
                    </div>
                )}

                {/* Checkout modal */}
                {showCheckout && (
                    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50" onClick={() => setShowCheckout(false)}>
                        <div className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl p-6 w-full max-w-md animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-gray-900 text-lg mb-4">Finalizar Pedido</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome (opcional)</label>
                                <input type="text" value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    placeholder="Ex.: João" />
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 my-4">
                                {cart.map(item => (
                                    <div key={item.produto_id} className="flex justify-between text-sm py-1">
                                        <span>{item.quantidade}x {item.nome}</span>
                                        <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-green-600">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'dinheiro', label: '💵', sublabel: 'Dinheiro' },
                                        { value: 'pix', label: '📱', sublabel: 'PIX' },
                                        { value: 'cartao', label: '💳', sublabel: 'Cartão' },
                                    ].map(method => (
                                        <button key={method.value}
                                            onClick={() => setPaymentMethod(method.value)}
                                            className={`p-4 border-2 rounded-xl text-center transition-all active:scale-95 ${paymentMethod === method.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                                }`}>
                                            <span className="text-2xl block">{method.label}</span>
                                            <span className="text-xs font-medium text-gray-700">{method.sublabel}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button onClick={handleFinalize}
                                    disabled={processing || !paymentMethod}
                                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-[0.98]">
                                    {processing ? 'Processando...' : '✅ Confirmar'}
                                </button>
                                <button onClick={() => setShowCheckout(false)}
                                    className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all">
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Spacer for sticky cart */}
                {cart.length > 0 && <div className="h-40 lg:h-0" />}
            </div>
        )
    }

    // =============== DASHBOARD VIEW ===============
    if (view === 'dashboard') {
        const totalVendas = pedidos.filter(p => p.status === 'pago' || p.status === 'entregue').reduce((s, p) => s + Number(p.total), 0)
        const totalPedidos = pedidos.length
        const pedidosPorMetodo = pedidos.reduce((acc, p) => {
            const m = p.metodo_pagamento || 'sem_metodo'
            acc[m] = (acc[m] || 0) + Number(p.total)
            return acc
        }, {} as Record<string, number>)

        const metodoLabels: Record<string, string> = {
            dinheiro: '💵 Dinheiro',
            pix: '📱 PIX',
            cartao: '💳 Cartão',
            sem_metodo: '❓ Não informado',
        }

        return (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('venda')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors">←</button>
                    <div>
                        <h2 className="font-bold text-gray-900">📊 Dashboard — {selectedPdv?.nome}</h2>
                        <p className="text-xs text-gray-400">{selectedEvento?.titulo}</p>
                    </div>
                    <button onClick={fetchDashboard}
                        className="ml-auto px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all">
                        🔄 Atualizar
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Total Vendido</p>
                        <p className="text-2xl font-bold text-green-600">R$ {totalVendas.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900">{totalPedidos}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-gray-900">R$ {totalPedidos > 0 ? (totalVendas / totalPedidos).toFixed(2).replace('.', ',') : '0,00'}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Produtos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedPdv?.eventos_produtos?.length || 0}</p>
                    </div>
                </div>

                {/* Sales by payment method */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Por Forma de Pagamento</h3>
                    {Object.keys(pedidosPorMetodo).length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada.</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(pedidosPorMetodo).map(([metodo, valor]) => (
                                <div key={metodo} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                    <span className="text-sm font-medium">{metodoLabels[metodo] || metodo}</span>
                                    <span className="font-bold text-green-600">R$ {valor.toFixed(2).replace('.', ',')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Últimos Pedidos</h3>
                    {loadingPedidos ? (
                        <div className="text-center py-8 text-gray-400">Carregando...</div>
                    ) : pedidos.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido ainda.</p>
                    ) : (
                        <div className="space-y-2">
                            {pedidos.slice(0, 20).map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{p.comprador_nome || 'Cliente'}</p>
                                        <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm text-green-600">R$ {Number(p.total).toFixed(2)}</span>
                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${p.status === 'pago' || p.status === 'entregue'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-yellow-50 text-yellow-700'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}
