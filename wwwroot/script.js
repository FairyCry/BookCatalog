let currentPage = 1;
const booksPerPage = 5;
function sendNewBookData(){
    const bookName = document.getElementById('bookName').value;
    const bookAuthor = document.getElementById('bookAuthor').value;
    const bookYearString = document.getElementById('bookYear').value;
    const bookGenre = document.getElementById('bookGenre').value;
    const yearErr = document.getElementById('yearError')
    let bookYear = parseInt(bookYearString) || 0;  // если не число, будет 0
    if(bookYear == 0){
        yearErr.innerText = "Пожалуйста введите год                  !"
        return;
    }
    fetch('/sendNewBookDataToServer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            BookName: bookName,
            BookAuthor: bookAuthor,
            BookYear: bookYear,
            BookGenre: bookGenre
            
        })
    })
    .then(r => r.text())
    .then(text =>{
        yearErr.innerText = text
    });
}
function Search(){
    const BookListWeb = document.getElementById('bookList');
    const userRequest = document.getElementById('search').value;
    const bookGenre = document.getElementById('bookGenre').value;
    
    console.log("то что ты получил", userRequest, bookGenre);
    
    if(userRequest.length == 0){
        loadBooksList();
        return;
    }
    
    BookListWeb.innerHTML = '';
    fetch('/search', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            SearchRequest: userRequest,
            SearchRequestGenre: bookGenre
        })
    })
    .then(r => r.json())
    .then(BookList => {
        BookList.forEach(BI =>{
            BookListWeb.innerHTML += renderBookLIst(BI);
        });
    });

}
function deleteBook(button){
    const bookId = button.getAttribute('data-id');
    fetch('/deleteBook', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            Id: bookId
        })
    })
    .then(r => r.text())
    .then(response =>{
        console.log(response);
        loadBooksList();
    });
}
function renderPagination(totalPages) {
    
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.onclick = () => {
            currentPage = i;
            loadBooksList();
        };
        paginationDiv.appendChild(btn);
    }
}
function loadBooksList() {
    const sortByNewest = document.getElementById('sortByNewest').checked
    const BookListWeb = document.getElementById('bookList');
    fetch(`/getbooks?page=${currentPage}&limit=${booksPerPage}&sortbynewest=${sortByNewest}`)
        .then(r => r.json())
        .then(data => {  // ← здесь data, а не BookList
            BookListWeb.innerHTML = '';
            data.books.forEach(BI => {  // ← data.books
                BookListWeb.innerHTML += renderBookLIst(BI);
            });
            renderPagination(data.totalPages);  // ← data.totalPages
        });
}
function checkForm() {
    const yearInput = document.getElementById('bookYear').value;
    const bookYear = parseInt(yearInput);
    const button = document.getElementById('sumbitBtn');

    if (isNaN(bookYear) || bookYear <= 0) {
        return;
    }
    
    button.disabled = false;
}
function renderBookLIst(BI){
                
              return  `
                    <li>
                        <b>Название: ${BI.bookName}</b>
                        <button data-id="${BI.id}" onclick="deleteBook(this)">Удалить</button>
                        <blockquote> Автор Книги: ${BI.bookAuthor} </blockquote>
                        <blockquote> Год Выпуска Книги: ${BI.bookYear} </blockquote>
                        <blockquote> Жанр Книги: ${BI.bookGenre} </blockquote>
                        <i>Дата добавления ${BI.bookAddedDate}</i><br> <br> 
                    </li>
                `;

}
const bookList = document.getElementById('bookList')
if(bookList){
    loadBooksList();
}