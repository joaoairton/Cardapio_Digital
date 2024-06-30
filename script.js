const menu = document.getElementById("menu");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cartCounter = document.getElementById("cart-count");
const addressWarn = document.getElementById("address-warn");

const cepInput = document.getElementById("cep");
const streetInput = document.getElementById("street");
const neighborhoodInput = document.getElementById("neighborhood");
const numberInput = document.getElementById("number");
const complementInput = document.getElementById("complement");
const cityInput = document.getElementById("city");
const cepWarn = document.getElementById("cep-warn");

let cart = [];

// Abre o modal do carrinho
cartBtn.addEventListener("click", function() {
    updateCartModal();
    cartModal.style.display = "flex";
});

// Fechar o modal quando clicar fora
cartModal.addEventListener("click", function(event){
    if(event.target === cartModal){
        cartModal.style.display = "none";
    }
});

// Fechar o modal quando clicar no botão "FECHAR"
closeModalBtn.addEventListener("click", function(){
    cartModal.style.display = "none";
});

// Pega o item que foi clicado
menu.addEventListener("click", function(event){
    let parentButton = event.target.closest(".add-too-cart-btn");

    if(parentButton){
        const name = parentButton.getAttribute("data-name");
        const price = parseFloat(parentButton.getAttribute("data-price"));  // converte em um valor float
        addToCart(name, price);
    }
});

// Função para adicionar no carrinho
function addToCart(name, price){
    const existingItem = cart.find(item => item.name === name);

    if (existingItem){
        // Se o item já existe no carrinho, adiciona +1 na quantidade
        existingItem.quantity += 1;
    }
    else{
        cart.push({
            name,
            price,
            quantity: 1,
        });
    }

    updateCartModal();
}

// Atualiza o carrinho
function updateCartModal(){
    cartItemsContainer.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const cartItemElement = document.createElement("div");
        cartItemElement.classList.add("flex", "justify-between", "mb-4", "flex-col");

        cartItemElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                <p class="font-medium">${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-from-cart-btn bg-red-500 text-white px-2 py-1 rounded" data-name="${item.name}">
                Remover
                </button>
            </div>
        `;
        
        // Calcula o TOTAL
        total += item.price * item.quantity;

        cartItemsContainer.appendChild(cartItemElement);
    });

    cartTotal.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    cartCounter.innerHTML = cart.length;
}

// Função para remover o item do carrinho
cartItemsContainer.addEventListener("click", function(event){
    if (event.target.classList.contains("remove-from-cart-btn")){
        const name = event.target.getAttribute("data-name");

        removeItemCart(name);
    }
});

function removeItemCart(name){
    const index = cart.findIndex(item => item.name === name);

    if (index !== -1){
        const item = cart[index];

        if(item.quantity > 1){
            item.quantity -= 1;
            updateCartModal();
            return;
        }
    
        cart.splice(index, 1);
        updateCartModal();
    }
}

// Busca de endereço pelo CEP
cepInput.addEventListener('blur', function(){
    const cep = this.value.replace(/\D/g, '');
    if (cep !== "" && /^[0-9]{8}$/.test(cep)) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    streetInput.value = data.logradouro;
                    neighborhoodInput.value = data.bairro;
                    cityInput.value = data.localidade;
                    numberInput.focus();
                    cepWarn.classList.add('hidden');
                } else {
                    cepWarn.textContent = 'CEP não encontrado.';
                    cepWarn.classList.remove('hidden');
                }
            })
            .catch(error => {
                cepWarn.textContent = 'Erro ao buscar o CEP.';
                cepWarn.classList.remove('hidden');
            });
    } else {
        cepWarn.textContent = 'Digite um CEP válido.';
        cepWarn.classList.remove('hidden');
    }
});

// Finalizar pedido
checkoutBtn.addEventListener('click', function() {
    // Verifica se o restaurante está aberto
    const isOpen = checkRestaurantOpen();

    if (!isOpen) {
        Toastify({
            text: "Ops, restaurante fechado!",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "#ef4444",
            },
        }).showToast();
        return;
    }

    if (cart.length === 0) {
        Toastify({
            text: "Ops, seu carrinho está vazio!",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "#ef4444",
            },
        }).showToast();
        return;
    }

    const number = numberInput.value;
    if (number.trim() === "") {
        addressWarn.classList.remove('hidden');
        numberInput.classList.add("border-red-500");
        return;
    }

    // Envia pedido para o WhatsApp
    let subtotal = 0;
    const cartItems = cart.map((item) => {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;
        return `${item.quantity} UNID. ${item.name.toUpperCase()} - R$ ${itemTotal.toFixed(2)}`;
    }).join("\n");

    const formattedSubtotal = `SUBTOTAL: R$ ${subtotal.toFixed(2)}`;
    const address = `${streetInput.value.toUpperCase()}, ${neighborhoodInput.value.toUpperCase()}`;
    const complemento = `${complementInput.value.toUpperCase()}`;
    const cep = `CEP: ${cepInput.value}`;
    const cidade = `${cityInput.value.toUpperCase()}`;
    const numberValue = numberInput.value;

    const formattedMessage = `
ENDEREÇO: ${address}
NÚMERO: ${number}
COMPLEMENTO: ${complemento}
${cep}
CIDADE: ${cidade}

========== ITENS DO PEDIDO ==========
${cartItems}

${formattedSubtotal}
    `;

    const message = encodeURIComponent(formattedMessage);
    const phone = "47997289921";

    const whatsappURL = `https://wa.me/${phone}?text=${message}`;
    console.log("WhatsApp URL:", whatsappURL); // Log para depuração

    window.open(whatsappURL, "_blank");
});

// Verifica a hora e manipula o horário
function checkRestaurantOpen() {
    const data = new Date();
    const hora = data.getHours();
    return hora > 18 && hora < 23; // Retorna TRUE "restaurante aberto"
}

const spanItem = document.getElementById("date-span");
const isOpen = checkRestaurantOpen();

if (isOpen) {
    spanItem.classList.remove("bg-red-500");
    spanItem.classList.add("bg-green-600");
} else {
    spanItem.classList.remove("bg-green-600");
    spanItem.classList.add("bg-red-500");
}
