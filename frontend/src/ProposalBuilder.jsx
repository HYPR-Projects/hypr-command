import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';

// ══════════════════════════════════════════════════════════════════════════════
// PROPOSAL BUILDER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * ProposalBuilder - Construtor de Propostas Comerciais
 * 
 * Permite ao time de vendas criar propostas rapidamente baseadas no template
 * da HYPR, com geração automática de Excel e PDF.
 */

const PRODUCT_TYPES = ['O2O', 'OOH', 'P-DOOH', 'RMN Digital', 'RMN Físico'];
const FORMATS = ['Display', 'Video'];
const PAYMENT_TYPES = ['CPM', 'CPCV', 'CPV', 'CPC'];
const PRACAS = ['Nacional', 'Regional', 'Capital', 'Interior'];

const FEATURES_OPTIONS = [
  'Survey',
  'Downloaded Apps',
  'Brand Lift',
  'P-DOOH',
  'Weather',
  'Topics',
  'Click to Calendar',
  'Tap To Chat',
  'Tap To Hotspot',
  'Attention Ad',
  'Footfall',
  'CTV',
  'TV Sync',
];

export default function ProposalBuilder({ user, clients, navigate, showToast }) {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [currentProposal, setCurrentProposal] = useState(null);

  // Form state
  const [formData, setFormData] = useState(getInitialFormData());
  const [scopeProducts, setScopeProducts] = useState([getInitialScopeProduct()]);
  const [contractedProducts, setContractedProducts] = useState([getInitialContractedProduct()]);
  const [bonifications, setBonifications] = useState([getInitialBonification()]);
  const [features, setFeatures] = useState([]);

  // ─── INITIAL DATA HELPERS ──────────────────────────────────────────────────
  function getInitialFormData() {
    return {
      client: '',
      agency: '',
      periodStart: '',
      periodEnd: '',
      praca: 'Nacional',
      projectDescription: '',
      proposalTitle: 'Pacote HYPR',
    };
  }

  function getInitialScopeProduct() {
    return {
      id: Date.now(),
      produto: 'O2O',
      cluster: '',
      behaviorOff: '',
      behaviorOn: '',
      volumetria: 0,
    };
  }

  function getInitialContractedProduct() {
    return {
      id: Date.now(),
      produto: 'O2O',
      segmentacao: 'Listada na aba "Audiências"',
      formato: 'Display',
      periodo: 'TBD',
      usuariosEstimados: 0,
      cobertura: 0.20,
      frequenciaMaxima: 4,
      tipoPagamento: 'CPM',
      cpmTabela: 24,
      desconto: 0.25,
    };
  }

  function getInitialBonification() {
    return {
      id: Date.now(),
      produto: 'O2O',
      segmentacao: 'Listada na aba "Audiências"',
      formato: 'Display',
    };
  }

  // ─── CALCULATIONS ──────────────────────────────────────────────────────────
  const calculations = useMemo(() => {
    // Calculate for each contracted product
    const contractedCalcs = contractedProducts.map(p => {
      const impressoesTotais = p.usuariosEstimados * p.cobertura * p.frequenciaMaxima;
      const cpmNegociadoBruto = p.cpmTabela * (1 - p.desconto);
      const cpmNegociadoLiquido = cpmNegociadoBruto * 0.8;
      const valorTotalBruto = (impressoesTotais / 1000) * cpmNegociadoBruto;
      const valorTotalLiquido = valorTotalBruto * 0.8;

      return {
        id: p.id,
        impressoesTotais,
        cpmNegociadoBruto,
        cpmNegociadoLiquido,
        valorTotalBruto,
        valorTotalLiquido,
      };
    });

    // Calculate for each bonification
    const bonificationCalcs = bonifications.map(b => {
      // Find the matching contracted product to get impressions
      const matchingProduct = contractedProducts.find(cp => cp.id === b.linkedProductId);
      const matchingCalc = contractedCalcs.find(cc => cc.id === b.linkedProductId);
      
      if (!matchingProduct || !matchingCalc) {
        return { id: b.id, impressoesTotais: 0, valorTotalBruto: 0 };
      }

      const impressoesTotais = matchingCalc.impressoesTotais;
      const cpmNegociadoBruto = matchingProduct.cpmTabela * (1 - matchingProduct.desconto);
      const valorTotalBruto = (cpmNegociadoBruto * impressoesTotais) / 1000;

      return {
        id: b.id,
        impressoesTotais,
        valorTotalBruto,
      };
    });

    // Totals
    const totalVolumetriaDisplay = contractedCalcs
      .filter((_, i) => contractedProducts[i].formato === 'Display')
      .reduce((sum, c) => sum + c.impressoesTotais, 0);

    const totalVolumetriaVideo = contractedCalcs
      .filter((_, i) => contractedProducts[i].formato === 'Video')
      .reduce((sum, c) => sum + c.impressoesTotais, 0);

    const totalValorBruto = contractedCalcs.reduce((sum, c) => sum + c.valorTotalBruto, 0);
    const totalValorLiquido = contractedCalcs.reduce((sum, c) => sum + c.valorTotalLiquido, 0);
    const totalBonificacao = bonificationCalcs.reduce((sum, c) => sum + c.valorTotalBruto, 0);

    return {
      contractedCalcs,
      bonificationCalcs,
      totals: {
        totalVolumetriaDisplay,
        totalVolumetriaVideo,
        totalValorBruto,
        totalValorLiquido,
        totalBonificacao,
        percentualBonificacao: totalValorBruto > 0 ? (totalBonificacao / totalValorBruto) : 0,
      },
    };
  }, [contractedProducts, bonifications]);

  // ─── LOAD PROPOSALS ────────────────────────────────────────────────────────
  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://hypr-command-backend-453955675457.southamerica-east1.run.app'}/proposals`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setProposals(data);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      showToast?.('Erro ao carregar propostas', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── SAVE PROPOSAL ─────────────────────────────────────────────────────────
  async function saveProposal(status = 'draft') {
    const proposalData = {
      ...formData,
      scopeProducts,
      contractedProducts,
      bonifications,
      features,
      ...calculations.totals,
      status,
      createdBy: user.name,
      createdByEmail: user.email,
    };

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://hypr-command-backend-453955675457.southamerica-east1.run.app'}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalData),
      });

      const result = await response.json();
      if (result.ok) {
        showToast?.('Proposta salva com sucesso!', 'success');
        loadProposals();
        setView('list');
        resetForm();
      } else {
        showToast?.('Erro ao salvar proposta', 'error');
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      showToast?.('Erro ao salvar proposta', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── GENERATE EXCEL ────────────────────────────────────────────────────────
  async function generateExcel() {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // ── Sheet 1: Escopo Projeto ────────────────────────────────────────────
      const wsEscopo = workbook.addWorksheet('Escopo Projeto');
      
      // Header
      wsEscopo.getCell('B2').value = 'ESCOPO DO PROJETO';
      wsEscopo.getCell('B2').font = { bold: true, size: 14 };
      
      wsEscopo.getCell('B3').value = formData.proposalTitle || 'Ativação HYPR';
      wsEscopo.getCell('B4').value = formData.projectDescription || 'Descrição do Projeto';
      wsEscopo.getCell('B6').value = `Praça: ${formData.praca}`;
      
      // Table headers
      wsEscopo.getCell('B8').value = 'Produto';
      wsEscopo.getCell('C8').value = 'Cluster';
      wsEscopo.getCell('D8').value = 'Comportamento OFF';
      wsEscopo.getCell('E8').value = 'Comportamento ON';
      wsEscopo.getCell('F8').value = 'Volumetria Estimada da Audiência';
      
      // Style headers
      ['B8', 'C8', 'D8', 'E8', 'F8'].forEach(cell => {
        wsEscopo.getCell(cell).font = { bold: true };
        wsEscopo.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      });
      
      // Scope products data
      scopeProducts.forEach((sp, idx) => {
        const row = 9 + idx;
        wsEscopo.getCell(`B${row}`).value = sp.produto;
        wsEscopo.getCell(`C${row}`).value = sp.cluster;
        wsEscopo.getCell(`D${row}`).value = sp.behaviorOff;
        wsEscopo.getCell(`E${row}`).value = sp.behaviorOn;
        wsEscopo.getCell(`F${row}`).value = sp.volumetria;
        wsEscopo.getCell(`F${row}`).numFmt = '#,##0';
      });
      
      // Total row
      const totalRow = 9 + scopeProducts.length;
      wsEscopo.getCell(`B${totalRow}`).value = 'TOTAL';
      wsEscopo.getCell(`B${totalRow}`).font = { bold: true };
      const totalVolume = scopeProducts.reduce((sum, sp) => sum + (sp.volumetria || 0), 0);
      wsEscopo.getCell(`F${totalRow}`).value = totalVolume;
      wsEscopo.getCell(`F${totalRow}`).numFmt = '#,##0';
      wsEscopo.getCell(`F${totalRow}`).font = { bold: true };
      
      // ── Sheet 2: Proposta ──────────────────────────────────────────────────
      const wsProposta = workbook.addWorksheet('Proposta Comercial');
      
      // Title
      wsProposta.mergeCells('E2:K2');
      wsProposta.getCell('E2').value = 'PROPOSTA COMERCIAL';
      wsProposta.getCell('E2').font = { bold: true, size: 16 };
      wsProposta.getCell('E2').alignment = { horizontal: 'center' };
      
      wsProposta.mergeCells('G3:I3');
      wsProposta.getCell('G3').value = formData.proposalTitle || 'Pacote HYPR';
      wsProposta.getCell('G3').font = { size: 12 };
      wsProposta.getCell('G3').alignment = { horizontal: 'center' };
      
      // Summary boxes (top right)
      wsProposta.getCell('K6').value = 'Volumetria Total Contratada - Display';
      wsProposta.getCell('L6').value = calculations.totals.totalVolumetriaDisplay;
      wsProposta.getCell('L6').numFmt = '#,##0';
      
      wsProposta.getCell('K7').value = 'Volumetria Total Contratada - Video';
      wsProposta.getCell('L7').value = calculations.totals.totalVolumetriaVideo;
      wsProposta.getCell('L7').numFmt = '#,##0';
      
      wsProposta.getCell('K8').value = 'Valor Total Bruto';
      wsProposta.getCell('L8').value = calculations.totals.totalValorBruto;
      wsProposta.getCell('L8').numFmt = 'R$ #,##0.00';
      
      wsProposta.getCell('K9').value = 'Valor Total Líquido';
      wsProposta.getCell('L9').value = calculations.totals.totalValorLiquido;
      wsProposta.getCell('L9').numFmt = 'R$ #,##0.00';
      
      wsProposta.getCell('K10').value = 'Bonificação Total';
      wsProposta.getCell('L10').value = calculations.totals.totalBonificacao;
      wsProposta.getCell('L10').numFmt = 'R$ #,##0.00';
      
      // Product table headers
      const headers = ['Produto', 'Segmentação', 'Formato', 'Período', 'Usuários/Telas Estimados', 
                      'Cobertura*', 'Frequência Máxima', 'Tipo de pagamento', 
                      'Impressões Contratadas Totais', 'CPM/CPCV Tabela', 'Desconto', 
                      'CPM/CPCV Negociado Bruto', 'CPM/CPCV Negociado Líquido', 'Valor Total Bruto', 'Valor Total Líquido'];
      
      headers.forEach((h, idx) => {
        const col = String.fromCharCode(66 + idx); // B, C, D, etc.
        wsProposta.getCell(`${col}12`).value = h;
        wsProposta.getCell(`${col}12`).font = { bold: true, size: 10 };
        wsProposta.getCell(`${col}12`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      });
      
      // Contracted products data
      contractedProducts.forEach((cp, idx) => {
        const row = 13 + idx;
        const calc = calculations.contractedCalcs[idx];
        
        wsProposta.getCell(`B${row}`).value = cp.produto;
        wsProposta.getCell(`C${row}`).value = cp.segmentacao;
        wsProposta.getCell(`D${row}`).value = cp.formato;
        wsProposta.getCell(`E${row}`).value = cp.periodo;
        wsProposta.getCell(`F${row}`).value = cp.usuariosEstimados;
        wsProposta.getCell(`F${row}`).numFmt = '#,##0';
        wsProposta.getCell(`G${row}`).value = cp.cobertura;
        wsProposta.getCell(`G${row}`).numFmt = '0.00%';
        wsProposta.getCell(`H${row}`).value = cp.frequenciaMaxima;
        wsProposta.getCell(`I${row}`).value = cp.tipoPagamento;
        wsProposta.getCell(`J${row}`).value = calc.impressoesTotais;
        wsProposta.getCell(`J${row}`).numFmt = '#,##0';
        wsProposta.getCell(`K${row}`).value = cp.cpmTabela;
        wsProposta.getCell(`K${row}`).numFmt = 'R$ #,##0.00';
        wsProposta.getCell(`L${row}`).value = cp.desconto;
        wsProposta.getCell(`L${row}`).numFmt = '0%';
        wsProposta.getCell(`M${row}`).value = calc.cpmNegociadoBruto;
        wsProposta.getCell(`M${row}`).numFmt = 'R$ #,##0.00';
        wsProposta.getCell(`N${row}`).value = calc.cpmNegociadoLiquido;
        wsProposta.getCell(`N${row}`).numFmt = 'R$ #,##0.00';
        wsProposta.getCell(`O${row}`).value = calc.valorTotalBruto;
        wsProposta.getCell(`O${row}`).numFmt = 'R$ #,##0.00';
        wsProposta.getCell(`P${row}`).value = calc.valorTotalLiquido;
        wsProposta.getCell(`P${row}`).numFmt = 'R$ #,##0.00';
      });
      
      // Column widths
      wsProposta.getColumn('B').width = 20;
      wsProposta.getColumn('C').width = 25;
      wsProposta.getColumn('D').width = 12;
      wsProposta.getColumn('E').width = 12;
      wsProposta.getColumn('F').width = 18;
      wsProposta.getColumn('G').width = 12;
      wsProposta.getColumn('H').width = 15;
      wsProposta.getColumn('I').width = 16;
      wsProposta.getColumn('J').width = 20;
      wsProposta.getColumn('K').width = 16;
      wsProposta.getColumn('L').width = 12;
      wsProposta.getColumn('M').width = 20;
      wsProposta.getColumn('N').width = 20;
      wsProposta.getColumn('O').width = 18;
      wsProposta.getColumn('P').width = 18;
      
      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposta_HYPR_${formData.client.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast?.('Excel gerado com sucesso!', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      showToast?.('Erro ao gerar Excel', 'error');
    }
  }

  // ─── RESET FORM ────────────────────────────────────────────────────────────
  function resetForm() {
    setFormData(getInitialFormData());
    setScopeProducts([getInitialScopeProduct()]);
    setContractedProducts([getInitialContractedProduct()]);
    setBonifications([getInitialBonification()]);
    setFeatures([]);
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="page-enter">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--fd)', fontSize: 26, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
              Proposal Builder
            </h1>
            <p style={{ color: 'var(--t3)', fontSize: 14, margin: '6px 0 0' }}>
              Crie propostas comerciais rapidamente
            </p>
          </div>
          <button className="btn" onClick={() => setView('create')}>
            <span style={{ fontSize: 18 }}>+</span> Nova Proposta
          </button>
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="empty">
            <div>Carregando propostas...</div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>
              Nenhuma proposta criada
            </div>
            <div style={{ fontSize: 13, color: 'var(--t3)' }}>
              Clique em "Nova Proposta" para começar
            </div>
          </div>
        ) : (
          <div className="g2">
            {proposals.map(proposal => (
              <div key={proposal.id} className="card">
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
                        {proposal.client}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                        {proposal.agency}
                      </div>
                    </div>
                    <span className={`badge ${proposal.status === 'draft' ? 'b-ylw' : proposal.status === 'sent' ? 'b-teal' : 'b-grn'}`}>
                      {proposal.status === 'draft' ? 'Rascunho' : proposal.status === 'sent' ? 'Enviada' : 'Aprovada'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bdr-card)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Valor Total</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.total_gross_value || 0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Criada por</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>
                        {proposal.created_by}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-sm" onClick={() => {/* TODO: Edit */}}>
                      Editar
                    </button>
                    <button className="btn btn-sm bg" onClick={() => {/* TODO: Download Excel */}}>
                      Download Excel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // CREATE/EDIT VIEW
  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <button className="btn bg" onClick={() => { setView('list'); resetForm(); }} style={{ marginBottom: 12 }}>
            ← Voltar
          </button>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 26, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            {currentProposal ? 'Editar Proposta' : 'Nova Proposta'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn bg" onClick={() => saveProposal('draft')} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Rascunho'}
          </button>
          <button className="btn" onClick={generateExcel}>
            Gerar Excel
          </button>
        </div>
      </div>

      {/* Form Content - To be continued in next part */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 20 }}>
          Em desenvolvimento...
        </div>
        <p>O formulário completo será implementado em breve.</p>
      </div>
    </div>
  );
}
