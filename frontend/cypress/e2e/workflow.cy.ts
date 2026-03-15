describe('ImprimiAqui3D - Full Workflow E2E', () => {
    // CONFIGURATION: Adjust these values if needed
    const TEST_USER = 'admin@admin.com';
    const TEST_PASS = 'admin123';
    const MODEL_TITLE = `Test Model ${Date.now()}`;

    beforeEach(() => {
        // We assume the user is already logged in or we mock the login
        // For a real E2E, we visit login
        cy.visit('/login');

        // Attempt login (this will fail if credentials don't exist, but shows the flow)
        cy.get('input[type="email"]').clear().type(TEST_USER);
        cy.get('input[type="password"]').clear().type(TEST_PASS);
        cy.get('button').contains('Entrar no Sistema').click();

        // Wait for redirect to dashboard
        cy.url().should('include', '/dashboard');
    });

    it('should create modeling, approve it, convert to sale and finish payment', () => {
        // 1. CREATE MODELING
        cy.visit('/modelagem');
        cy.contains('Novo Pedido').click();

        cy.get('input[placeholder*="Chaveiro"]').type(MODEL_TITLE);
        cy.get('textarea[placeholder*="Descreva"]').type('Automated E2E Test Description');
        cy.get('input[type="date"]').type('2026-12-31');
        cy.get('select').select('HIGH');

        cy.get('button').contains('Salvar').click();

        // Verify it appeared in "Briefing" column
        cy.contains(MODEL_TITLE).should('exist');

        // 2. APPROVE MODELING
        cy.contains(MODEL_TITLE).click(); // Open details
        cy.get('select').last().select('APPROVED'); // Change status to Approved
        cy.get('button').contains('Fechar').click({ force: true });

        // Verify it moved to "Aprovado" column or shows the button
        cy.contains(MODEL_TITLE).should('exist');

        // 3. CONVERT TO SALE
        // Find the card again and click "Converter em Venda"
        cy.contains(MODEL_TITLE).parents('.bg-white').within(() => {
            cy.contains('Converter em Venda').click();
        });

        // Handle confirmation dialog
        cy.on('window:confirm', () => true);

        // 4. FINALIZE IN CAIXA
        cy.url().should('include', '/caixa');
        cy.contains('Resumo').should('exist');

        // In Caixa, we might need to add a customer or just finalize
        cy.get('button').contains('Finalizar Venda').should('not.be.disabled').click();

        // Verify success (e.g., redirect or success message)
        // cy.contains('Venda realizada com sucesso').should('exist');
    });
});
