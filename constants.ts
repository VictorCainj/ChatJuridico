export const MODEL_FLASH = 'gemini-2.5-flash';
export const MODEL_PRO = 'gemini-2.5-pro';

export const SYSTEM_INSTRUCTION = `Você é um assistente jurídico especializado, focado exclusivamente na Lei do Inquilinato do Brasil (Lei nº 8.245/91) e na jurisprudência relevante. Sua função é auxiliar profissionais de imobiliárias a resolverem dúvidas complexas do dia a dia sobre locações de imóveis.

Suas respostas devem ser:
1.  **Precisas e Fundamentadas:** Sempre baseie suas respostas nos artigos da Lei do Inquilinato e, quando aplicável, em decisões e entendimentos de tribunais (jurisprudência). Cite os artigos da lei quando for relevante.
2.  **Claras e Objetivas:** Use uma linguagem profissional, mas de fácil compreensão para quem não é advogado. Evite jargões jurídicos excessivos.
3.  **Estruturadas:** Organize a resposta de forma lógica. Comece com a resposta direta, depois apresente o fundamento legal e, se houver, exemplos práticos.
4.  **Formatação Específica:** Ao citar o texto completo de um artigo de lei, um parágrafo de jurisprudência ou qualquer trecho que deva ser copiado com precisão, formate-o como um bloco de código Markdown (usando \`\`\`). Isso garantirá clareza e facilitará a cópia do texto.
5.  **Cautelosas:** Ao final de cada resposta, inclua o seguinte aviso em negrito: '**Aviso:** Esta é uma orientação informativa e não substitui uma consulta jurídica formal com um advogado. As leis e a jurisprudência podem mudar.'

Não responda a perguntas que não estejam relacionadas a problemas de locação de imóveis no Brasil. Se o usuário fizer uma pergunta fora do escopo, responda educadamente: 'Minha especialidade é a Lei do Inquilinato no Brasil. Não tenho conhecimento para responder sobre outros assuntos.'`;

export const legalDefinitions: Record<string, any> = {
  'locador': 'Definição Jurídica: É a parte que detém a propriedade ou o direito de uso de um imóvel e o cede a outra parte (locatário) para uso, mediante remuneração (aluguel). Suas principais obrigações incluem entregar o imóvel em estado de servir ao uso a que se destina e garantir o uso pacífico do bem.',
  'locatário': 'Definição Jurídica: Conhecido como inquilino, é a parte que recebe o imóvel para uso, comprometendo-se ao pagamento do aluguel e demais encargos. Deve zelar pela conservação do imóvel como se fosse seu, restituindo-o no final do contrato no estado em que o recebeu, salvo as deteriorações decorrentes do uso normal.',
  'fiador': 'Definição Jurídica: É um terceiro que se obriga pessoalmente pelo pagamento das dívidas do locatário, caso este não cumpra suas obrigações. A fiança é uma garantia pessoal e o fiador responde com seu patrimônio, incluindo, em alguns casos, seu único imóvel residencial (bem de família).',
  'caução': 'Definição: Garantia locatícia que consiste no depósito em dinheiro (geralmente até 3 meses de aluguel) em uma conta poupança. O valor é devolvido ao locatário ao final do contrato, se não houver débitos.',
  'fiança': 'Definição: Modalidade de garantia em que um terceiro (fiador) garante o pagamento do aluguel e demais encargos caso o locatário se torne inadimplente.',
  'despejo': 'Definição Jurídica: É o procedimento judicial específico pelo qual o locador busca a desocupação do imóvel e a retomada de sua posse, encerrando a relação locatícia. Pode ser motivada por falta de pagamento (causa mais comum), infração contratual, término do contrato, entre outras hipóteses previstas em lei.',
  'denúncia vazia': 'Definição: Rescisão do contrato de locação pelo locador, sem a necessidade de apresentar uma justificativa. É aplicável em contratos com prazo indeterminado ou ao final do prazo determinado, conforme regras específicas da lei.',
  'denúncia cheia': 'Definição: Rescisão do contrato de locação pelo locador, baseada em uma justificativa prevista em lei, como a necessidade do imóvel para uso próprio ou a realização de obras urgentes.',
  'benfeitorias': 'Definição: Obras ou despesas realizadas no imóvel para conservá-lo, melhorá-lo ou embelezá-lo. Podem ser necessárias, úteis ou voluptuárias, e seu ressarcimento depende do que foi acordado em contrato.',
  'direito de preferência': 'Definição: Direito do locatário de ter prioridade na compra do imóvel alugado, caso o locador decida vendê-lo. O locador deve oferecer o imóvel ao locatário nas mesmas condições oferecidas a terceiros.',
  'art. 4º': 'Art. 4º - Durante o prazo estipulado para a duração do contrato, não poderá o locador reaver o imóvel alugado. Com exceção do que estipula o § 2o do art. 54-A, o locatário, todavia, poderá devolvê-lo, pagando a multa pactuada, proporcional ao período de cumprimento do contrato, ou, na sua falta, a que for judicialmente estipulada.',
  'art. 5º': 'Art. 5º - Seja qual for o fundamento do término da locação, a ação do locador para reaver o imóvel é a de despejo.',
  'art. 6º': 'Art. 6º - O locatário poderá denunciar a locação por prazo indeterminado mediante aviso por escrito ao locador, com antecedência mínima de trinta dias.',
  'art. 23': {
    summary: 'Resume as principais obrigações do locatário, incluindo: pagar o aluguel em dia, usar o imóvel para o fim combinado, zelar pela sua conservação, reparar danos causados por si, e devolver o imóvel no mesmo estado em que o recebeu (salvo o desgaste natural).',
    fullText: `Art. 23 - O locatário é obrigado a:
I - pagar pontualmente o aluguel e os encargos da locação, legal ou contratualmente exigíveis, no prazo estipulado ou, em sua falta, até o sexto dia útil do mês seguinte ao vencido, no imóvel locado, quando outro local não tiver sido indicado no contrato;
II - servir - se do imóvel para o uso convencionado ou presumido, compatível com a natureza deste e com o fim a que se destina, devendo tratá - lo com o mesmo cuidado como se fosse seu;
III - restituir o imóvel, finda a locação, no estado em que o recebeu, salvo as deteriorações decorrentes do seu uso normal;
IV - levar imediatamente ao conhecimento do locador o surgimento de qualquer dano ou defeito cuja reparação a este incumba, bem como as eventuais turbações de terceiros;
V - realizar a imediata reparação dos danos verificados no imóvel, ou nas suas instalações, provocadas por si, seus dependentes, familiares, visitantes ou prepostos;
VI - não modificar a forma interna ou externa do imóvel sem o consentimento prévio e por escrito do locador;
VII - entregar imediatamente ao locador os documentos de cobrança de tributos e encargos condominiais, bem como qualquer intimação, multa ou exigência de autoridade pública, ainda que dirigidas a ele, locatário;
VIII - pagar as despesas de telefone e de consumo de força, luz e gás, água и esgoto;
IX - permitir a vistoria do imóvel pelo locador ou por seu mandatário, mediante combinação prévia de dia e hora, bem como admitir que seja o mesmo visitado e examinado por terceiros, na hipótese de venda, promessa de venda, cessão ou promessa de cessão de direitos ou dação em pagamento;
X - cumprir integralmente a convenção de condomínio e os regulamentos internos;
XI - pagar o prêmio do seguro de fiança;
XII - pagar as despesas ordinárias de condomínio.`
  },
  'art. 46': {
    summary: 'Regula contratos de locação residencial com prazo de 30 meses ou mais. Ao final do prazo, o contrato termina automaticamente. Se o inquilino permanecer no imóvel por mais de 30 dias sem oposição do locador, o contrato é prorrogado por prazo indeterminado.',
    fullText: 'Art. 46 - Nas locações ajustadas por escrito e por prazo igual ou superior a trinta meses, a resolução do contrato ocorrerá findo o prazo estipulado, independentemente de notificação ou aviso. § 1º Findo o prazo ajustado, se o locatário continuar na posse do imóvel alugado por mais de trinta dias sem oposição do locador, presumir - se - á prorrogada a locação por prazo indeterminado, mantidas as demais cláusulas e condições do contrato.'
  },
  'art. 47': {
    summary: 'Aplica-se a contratos de locação residencial com prazo inferior a 30 meses (ou verbais). Findo o prazo, o contrato é prorrogado automaticamente. O locador só pode reaver o imóvel em situações específicas previstas em lei (ex: para uso próprio).',
    fullText: 'Art. 47 - Quando ajustada verbalmente ou por escrito e com prazo inferior a trinta meses, findo o prazo estabelecido, a locação prorroga - se automaticamente, por prazo indeterminado, somente podendo ser retomado o imóvel nos casos previstos nos incisos deste artigo (ex: uso próprio, descumprimento, obras, etc.).'
  },
  'lei nº 8.245/91': 'Lei do Inquilinato (Lei nº 8.245/91): É a principal legislação federal que regula as locações de imóveis urbanos no Brasil. Ela estabelece os direitos e deveres de locadores e locatários, os tipos de garantias, as regras para reajuste de aluguel e as ações judiciais pertinentes, como o despejo.'
};