using Microsoft.EntityFrameworkCore;
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.UseDefaultFiles(); 
app.UseStaticFiles(); 

using (var db = new AppDbContext())
{
    db.Database.EnsureCreated();
}
app.MapGet("/getbooks", (int page, int limit, bool sortbynewest) =>
{
    using var db = new AppDbContext();
    
    var query = db.BooksList.AsQueryable();
    
    if (sortbynewest)
    {
        query = query.OrderByDescending(book => book.Id);
    }
    
    int totalBooks = query.Count();  // ← важно: считаем после фильтрации
    int totalPages = (int)Math.Ceiling(totalBooks / (double)limit);
    
    var books = query
        .Skip((page - 1) * limit)
        .Take(limit)
        .ToList();
    
    return Results.Json(new { books, totalPages });
});
app.MapPost("/search", (UserSearchRequest USR) =>
{
    Console.WriteLine($"Поиск: Текст='{USR.SearchRequest}', Жанр='{USR.SearchRequestGenre}'");
    using var db = new AppDbContext();
    
    var query = db.BooksList.AsQueryable();

    // Фильтр по тексту (название или автор)
    if (!string.IsNullOrEmpty(USR.SearchRequest))
    {
        query = query.Where(b => b.BookName.Contains(USR.SearchRequest) || 
                                 b.BookAuthor.Contains(USR.SearchRequest));
    }
    
    // Фильтр по жанру (только если выбран конкретный жанр, не "Все")
    if (!string.IsNullOrEmpty(USR.SearchRequestGenre))
    {
        query = query.Where(b => b.BookGenre == USR.SearchRequestGenre);
    }

    var result = query.ToList();
    return Results.Json(result);
});
app.MapPost("/deleteBook", (DeleteRequest request) =>
{
    using (var db = new AppDbContext())
    {
        var BookId = db.BooksList.FirstOrDefault(book => book.Id == request.Id);
        if (BookId != null)
        {
            db.BooksList.Remove(BookId);
            db.SaveChanges();
        }
    }
    return $"Удалена книга под номером {request.Id}";
});
app.MapPost("/sendNewBookDataToServer", (Book data) =>
{
    using (var db = new AppDbContext())
    {
        Book newBook = new Book 
        {
            BookName = data.BookName, 
            BookAuthor = data.BookAuthor, 
            BookYear = data.BookYear,
            BookGenre = data.BookGenre,
            BookAddedDate = DateTime.Now.ToString("yyyy-MM-dd")
            
        }; 
        Console.WriteLine(newBook.BookAddedDate);
        if(newBook.BookName.Length == 0) newBook.BookName = "Название Книги Отсутствует";
        if(newBook.BookAuthor.Length == 0) newBook.BookAuthor = "Автор Книги Не Указан";
        if(newBook.BookGenre.Length == 0) newBook.BookGenre = "Пусто";
        db.BooksList.Add(newBook);
        db.SaveChanges();
    }
    
    return "Книга успешно добавлена!";
});

app.Run();

public class Book
{
    public int Id{get; set;}
    public string BookName{get; set;} = string.Empty;
    public string BookAuthor{get; set ;} = string.Empty;
    public int BookYear{get; set;}
    public string BookGenre{get; set;} = string.Empty;
    public string BookAddedDate{get; set;} = string.Empty;
}
public class UserSearchRequest
{
    public string SearchRequest {get; set;} = string.Empty;
    public string SearchRequestGenre {get; set;} = string.Empty;
}
public class DeleteRequest
{
    public int Id{get; set;}
}
public class AppDbContext : DbContext
{
    public DbSet<Book> BooksList { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // указываем, что используем SQLite, файл базы данных будет называться tasks.db
        optionsBuilder.UseSqlite("Data Source=bookslist.db");
    }
}