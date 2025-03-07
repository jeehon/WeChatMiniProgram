using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace KnowledgeCreationTimeBackend.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly string _connectionString;

        public UploadController(IConfiguration configuration)
        {
            _connectionString = configuration["ConnectionString"] ?? throw new ArgumentNullException(nameof(configuration), "ConnectionString is not configured.");
        }

        // POST Upload
        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile formFile)
        {
            try
            {
                if (formFile == null || string.IsNullOrEmpty(formFile.FileName))
                {
                    var requestFiles = HttpContext?.Request?.Form?.Files;
                    if (requestFiles == null || requestFiles.Count == 0)
                        return BadRequest("No file uploaded.");

                    var file = requestFiles[0];
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    if (!Directory.Exists(filePath))
                    {
                        Directory.CreateDirectory(filePath);
                    }

                    var newFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                    using (var stream = new MemoryStream())
                    {
                        await file.CopyToAsync(stream);
                        var url = await UploadFileAsBlob(stream, newFileName);
                        return Ok(url);
                    }
                }
                else
                {
                    var newFileName = Guid.NewGuid().ToString() + Path.GetExtension(formFile.FileName);
                    using (var stream = new MemoryStream())
                    {
                        await formFile.CopyToAsync(stream, CancellationToken.None);
                        var url = await UploadFileAsBlob(stream, newFileName);
                        return Ok(url);
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<string> UploadFileAsBlob(Stream stream, string filename)
        {
            try
            {
                var containerName = "image";

                var blobServiceClient = new BlobServiceClient(_connectionString);
                var blobContainerClient = blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = blobContainerClient.GetBlobClient(filename);

                stream.Position = 0;
                await blobClient.UploadAsync(stream, true);

                return blobClient.Uri.ToString();
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
